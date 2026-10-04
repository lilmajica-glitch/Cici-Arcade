#!/usr/bin/env node

/**
 * 🎬 霓虹跑酷 Intro 视频 - 快速操作脚本
 *
 * 使用方法:
 *   node intro-helper.js [命令]
 *
 * 可用命令:
 *   preview    - 启动Remotion Studio预览
 *   render     - 渲染视频为MP4
 *   render-hq  - 高质量渲染（质量100）
 *   render-fast - 快速低质量渲染（用于测试）
 *   render-mobile - 渲染移动端版本（720p）
 *   status     - 查看当前状态
 *   help       - 显示帮助信息
 */

import { exec } from 'child_process'
import { existsSync } from 'fs'
import { promisify } from 'util'

const execAsync = promisify(exec)

const commands = {
  preview: {
    cmd: 'npm run intro:preview',
    desc: '启动Remotion Studio实时预览',
    info: '将在浏览器中打开 http://localhost:3002'
  },
  render: {
    cmd: 'npm run intro:render',
    desc: '渲染标准质量视频（1920x1080, 60fps）',
    info: '输出文件: public/intro.mp4'
  },
  'render-hq': {
    cmd: 'remotion render src/intro/Root.tsx NeonRunnerIntro public/intro.mp4 --quality=100',
    desc: '渲染最高质量视频',
    info: '文件较大，但质量最佳'
  },
  'render-fast': {
    cmd: 'remotion render src/intro/Root.tsx NeonRunnerIntro public/intro-test.mp4 --quality=50 --scale=0.5',
    desc: '快速渲染低质量版本（用于测试）',
    info: '输出文件: public/intro-test.mp4'
  },
  'render-mobile': {
    cmd: 'remotion render src/intro/Root.tsx NeonRunnerIntro public/intro-mobile.mp4 --width=1280 --height=720',
    desc: '渲染移动端版本（720p）',
    info: '输出文件: public/intro-mobile.mp4'
  },
  status: {
    cmd: null,
    desc: '查看当前状态',
    info: '检查文件和配置'
  },
  help: {
    cmd: null,
    desc: '显示此帮助信息',
    info: ''
  }
}

function printHeader() {
  console.log('\n' + '═'.repeat(60))
  console.log('🎬 霓虹跑酷 Intro 视频助手')
  console.log('═'.repeat(60) + '\n')
}

function printHelp() {
  printHeader()
  console.log('可用命令:\n')

  Object.entries(commands).forEach(([name, { desc, info }]) => {
    console.log(`  ${name.padEnd(15)} - ${desc}`)
    if (info) {
      console.log(`                   ${info}`)
    }
    console.log()
  })

  console.log('示例:')
  console.log('  node intro-helper.js preview')
  console.log('  node intro-helper.js render')
  console.log('  node intro-helper.js status\n')
}

async function checkStatus() {
  printHeader()
  console.log('📊 当前状态检查\n')

  const checks = [
    {
      name: 'Remotion已安装',
      check: () => existsSync('node_modules/remotion')
    },
    {
      name: 'Three.js已安装',
      check: () => existsSync('node_modules/three')
    },
    {
      name: 'Intro组件存在',
      check: () => existsSync('src/intro/IntroVideo.tsx')
    },
    {
      name: '鞋子模型存在',
      check: () => existsSync('src/intro/Shoe.tsx')
    },
    {
      name: '赛道组件存在',
      check: () => existsSync('src/intro/NeonTrack.tsx')
    },
    {
      name: '粒子系统存在',
      check: () => existsSync('src/intro/ParticleSystem.tsx')
    },
    {
      name: '集成组件存在',
      check: () => existsSync('src/components/IntroScreen.tsx')
    },
    {
      name: 'Remotion配置存在',
      check: () => existsSync('remotion.config.ts')
    },
    {
      name: '视频已渲染',
      check: () => existsSync('public/intro.mp4')
    }
  ]

  let allPassed = true

  checks.forEach(({ name, check }) => {
    const passed = check()
    const icon = passed ? '✓' : '✗'
    const color = passed ? '\x1b[32m' : '\x1b[31m'
    console.log(`${color}${icon}\x1b[0m ${name}`)
    if (!passed) allPassed = false
  })

  console.log()

  if (allPassed) {
    console.log('\x1b[32m✓ 所有检查通过！系统准备就绪。\x1b[0m\n')
    console.log('下一步:')
    console.log('  1. 预览: node intro-helper.js preview')
    console.log('  2. 或直接渲染: node intro-helper.js render\n')
  } else {
    console.log('\x1b[33m⚠ 部分检查未通过。\x1b[0m\n')
    if (!existsSync('public/intro.mp4')) {
      console.log('💡 提示: 视频尚未渲染，运行以下命令生成:')
      console.log('   node intro-helper.js render\n')
    }
  }
}

async function runCommand(commandName) {
  const command = commands[commandName]

  if (!command) {
    console.error(`\x1b[31m✗ 未知命令: ${commandName}\x1b[0m\n`)
    printHelp()
    process.exit(1)
  }

  if (commandName === 'help') {
    printHelp()
    return
  }

  if (commandName === 'status') {
    await checkStatus()
    return
  }

  printHeader()
  console.log(`📹 执行: ${command.desc}`)
  console.log(`💡 ${command.info}\n`)
  console.log('─'.repeat(60))
  console.log()

  try {
    const { stdout, stderr } = await execAsync(command.cmd, {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    })

    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)

    console.log()
    console.log('─'.repeat(60))
    console.log('\x1b[32m✓ 完成！\x1b[0m\n')

  } catch (error) {
    console.error('\x1b[31m✗ 错误:\x1b[0m', error.message)
    process.exit(1)
  }
}

// 主程序
const args = process.argv.slice(2)
const commandName = args[0] || 'help'

runCommand(commandName)
