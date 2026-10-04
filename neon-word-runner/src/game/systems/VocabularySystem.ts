import type { ParkourAction } from './PlayerStateMachine';
import type { QuestionDirection } from '../../types/game';

export interface VocabularyEntry {
  id: string;
  english: string;
  chinese: string;
  pronunciation: string;
  difficulty: 1 | 2 | 3;
}

export type PromptType = 'meaning-to-word' | 'word-to-meaning';

export interface VocabularyQuestion {
  id: string;
  entryId: string;
  promptType: PromptType;
  prompt: string;
  english: string;
  choices: [string, string, string];
  correctIndex: number;
  pronunciation: string;
  difficulty: 1 | 2 | 3;
  action: ParkourAction;
}

export interface VocabularyStats {
  correct: number;
  wrong: number;
  accuracy: number;
  wordsReviewed: number;
}

export interface QuestionDecision {
  correct: boolean;
  correctIndex: number;
  chosenIndex: number | null;
  question: VocabularyQuestion;
  stats: VocabularyStats;
}

export class VocabularySystem {
  private readonly questions: VocabularyQuestion[];
  private current: VocabularyQuestion | null = null;
  private cursor = 0;
  private correctCount = 0;
  private wrongCount = 0;
  private readonly reviewed = new Set<string>();

  constructor(
    entries: readonly VocabularyEntry[],
    direction: QuestionDirection,
    actions: readonly ParkourAction[],
    random: () => number = Math.random,
  ) {
    if (entries.length < 3) throw new Error('Vocabulary needs at least three entries to build choices.');
    if (actions.length === 0) throw new Error('Every vocabulary question needs a route action.');
    const selectedEntries = shuffle(entries, random).slice(0, actions.length);
    this.questions = selectedEntries.map((entry, index) => {
      const distractors = shuffle(entries.filter((candidate) => candidate.id !== entry.id), random).slice(0, 2);
      const options = shuffle([entry, ...distractors], random);
      const promptType: PromptType = direction === 'zh-en' ? 'meaning-to-word' : 'word-to-meaning';
      const choices = options.map((option) => direction === 'zh-en' ? option.english : option.chinese) as [string, string, string];
      return {
        id: `run-${index + 1}-${entry.id}`,
        entryId: entry.id,
        promptType,
        prompt: direction === 'zh-en' ? entry.chinese : entry.english,
        english: entry.english,
        choices,
        correctIndex: options.findIndex((option) => option.id === entry.id),
        pronunciation: entry.pronunciation,
        difficulty: entry.difficulty,
        action: actions[index],
      };
    });
  }

  get stats(): VocabularyStats {
    const judged = this.correctCount + this.wrongCount;
    return {
      correct: this.correctCount,
      wrong: this.wrongCount,
      accuracy: judged === 0 ? 0 : Math.round((this.correctCount / judged) * 100),
      wordsReviewed: this.reviewed.size,
    };
  }

  get questionCount(): number {
    return this.questions.length;
  }

  presentNext(): VocabularyQuestion | null {
    if (this.current || this.cursor >= this.questions.length) return null;
    this.current = this.questions[this.cursor];
    this.cursor += 1;
    this.reviewed.add(this.current.entryId);
    return this.current;
  }

  submit(questionId: string, chosenIndex: number): QuestionDecision | null {
    if (!this.current || this.current.id !== questionId || !Number.isInteger(chosenIndex) || chosenIndex < 0 || chosenIndex > 2) {
      return null;
    }
    return this.decide(chosenIndex);
  }

  timeout(questionId: string): QuestionDecision | null {
    if (!this.current || this.current.id !== questionId) return null;
    return this.decide(null);
  }

  private decide(chosenIndex: number | null): QuestionDecision {
    const question = this.current!;
    const correct = chosenIndex === question.correctIndex;
    if (correct) this.correctCount += 1;
    else this.wrongCount += 1;
    this.current = null;
    return {
      correct,
      correctIndex: question.correctIndex,
      chosenIndex,
      question,
      stats: this.stats,
    };
  }
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
