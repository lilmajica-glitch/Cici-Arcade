import { Composition } from 'remotion'
import { IntroVideo } from './IntroVideo'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NeonRunnerIntro"
        component={IntroVideo}
        durationInFrames={480} // 8 seconds at 60fps
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  )
}
