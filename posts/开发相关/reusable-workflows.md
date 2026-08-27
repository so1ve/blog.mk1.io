---
published: 2025-12-15
---

# 可重用的工作流

## 正文

在开发项目时，我们经常会遇到需要在多个仓库中使用相似的 CI/CD 工作流的情况。随着项目数量的增加，相同的工作流代码会不断增加，维护这些重复的工作流也会变得越来越繁琐，例如，更新某个步骤时需要在所有相关仓库中进行修改。为了解决这个问题，GitHub Actions 提供了重用工作流的功能，使我们能够将常用的工作流定义为独立的文件，并在其他工作流中引用它们，从而实现代码复用和集中管理。

## Composite Actions 和 Reusable Workflows

在介绍如何重用工作流之前，我们先要区分两种不同的复用机制：Composite Actions 和 Reusable Workflows。简单来说：Composite Actions 是复用多个步骤，例如设置运行时、安装依赖等；而 Reusable Workflows 则是复用整个工作流，包括触发条件、作业定义等（例如构建、测试、部署等）。

| 方面        | Reusable Workflows                                           | Composite Actions                                                            |
| ----------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 位置        | 通常放置在 `.github/workflows/` 目录中。                     | 通常放置在 `.github/actions/` 目录中。                                       |
| YAML 文件名 | 工作流文件可以有任何名称，例如 `reusable-workflow.yml`。     | 操作文件必须命名为 `action.yml`。                                            |
| 文件结构    | 包含一个定义工作流的单一 YAML 文件，包含 `jobs` 和 `steps`。 | 包含操作所在目录，包括一个 `action.yml` 文件，并可包含其他脚本或依赖项文件。 |
| 使用方法    | 在其他工作流中使用 `uses: <repo>/<path>@<branch>`。          | 在作业步骤中使用 `uses: <repo>/<action-path>@<branch>`。                     |
| 组件        | 可以包含多个 `jobs`，允许复杂的工作流。                      | 仅包含 `steps`；不定义 `jobs`。                                              |
| 输入        | 可以定义类型，默认值可以跟随类型变化                         | 不能定义类型，只能使用 string 作为默认值                                     |

更多区别可以参见这篇 [Medium 文章](https://medium.com/@reach2shristi.81/reusable-workflows-and-composite-actions-in-github-actions-013b177e8b6c) 和这篇 [Dev.to 文章](https://dev.to/n3wt0n/composite-actions-vs-reusable-workflows-what-is-the-difference-github-actions-11kd)。

## 创建可重用的工作流

我们需要先进行准备工作。这里我创建一个新的 GitHub 仓库 [`so1ve/workflows`](https://github.com/so1ve/workflows) 来存放可重用的工作流。

### Composite Actions

在常见的 CI/CD 工作流中，我们经常需要执行一些重复的任务。一个典型的例子是在执行实际的 CI/CD 任务前初始化环境，需要运行的操作包括例如检出代码库、设置 Node.js 环境、安装依赖。这里存在着明显的代码重复：

- `@actions/checkout` 有不同的版本，需要在每个工作流中指定版本号，但是版本号可能会过时，而我们的检出逻辑实际上是相同的
- `@actions/setup-node` 可以设置不同版本的 Node.js 环境，但是我的项目的支持目标通常是相同的，一旦 Node.js 发布了新版本，我们就需要在所有工作流中更新版本号，此外还有设置缓存等逻辑
- 安装依赖的命令在不同项目中可能会有所不同（例如 `npm install`、`yarn install`、`pnpm install`），但是安装依赖的逻辑是相同的，区别只有包管理器

为了解决这些问题，我们可以将这些重复的步骤封装成 Composite Actions，从而实现代码复用。这样，我们只需要在需要初始化环境的地方引用这个 Composite Action 即可，此后如果需要更新逻辑只需要修改一个地方。

在 `so1ve/workflows` 仓库中创建一个新的目录 `setup-js`，并在该目录下创建一个 `action.yml` 文件。 `setup-js` 是一个 Composite Action，用于设置 JavaScript 项目的运行环境。`action.yml` 文件的内容如下：

```yaml,setup-js/action.yml
name: Setup JavaScript
description: Setup JavaScript environment

inputs:
  persist-credentials:
    description: Whether to configure the token or SSH key with the local git config
    default: "false"

  fetch-all:
    description: Whether to fetch all history for all branches and tags.
    default: "false"

  node-version:
    description: "Version Spec of the version to use. Examples: 12.x, 10.15.1, >=10.15.0."
    default: "lts/*"

  setup-ni:
    description: Whether to setup @antfu/ni for installing dependencies.
    default: "true"

  auto-install:
    description: Whether to automatically install dependencies.
    default: "true"

  no-frozen-lockfile:
    description: Whether to disable frozen lockfile installation.
    default: "false"

  package-manager:
    description: "Package manager to use. Examples: npm, yarn, pnpm."
    default: pnpm

runs:
  using: composite
  steps:
    - name: Checkout
      uses: actions/checkout@v6.0.1
      with:
        persist-credentials: ${{ inputs.persist-credentials }}
        fetch-depth: "${{ inputs.fetch-all == 'true' && '0' || '1' }}"

    - name: Install pnpm
      uses: pnpm/action-setup@v4.2.0
      if: ${{ inputs.package-manager == 'pnpm' }}

    - name: Setup node
      uses: actions/setup-node@v6.1.0
      with:
        node-version: ${{ inputs.node-version }}
        cache: ${{ inputs.package-manager }}
        registry-url: "https://registry.npmjs.org"

    - name: Update npm
      shell: bash
      run: npm install -g npm@latest

    - name: Install @antfu/ni
      shell: bash
      run: ${{ inputs.package-manager }} install -g @antfu/ni
      if: ${{ inputs.setup-ni }}

    - name: Install dependencies
      shell: bash
      run: ${{ inputs.package-manager }} install ${{ inputs.no-frozen-lockfile == 'true' && '--no-frozen-lockfile' || '' }}
      if: ${{ inputs.auto-install }}
```


其中：

- `inputs` 定义了 Composite Action 接受的输入参数，例如 `node-version` 用于指定 Node.js 版本，`package-manager` 用于指定包管理器等。
- `runs` 定义了 Composite Action 的执行逻辑，包含多个步骤，例如检出代码、安装 Node.js、安装依赖等。
  - `using` 必须为 `composite`，表示这是一个 Composite Action。
  - `steps` 定义了具体的执行步骤，每个步骤可以使用其他 Action，或者直接运行 shell 命令。如果是运行 shell 命令，则必须指定 `shell` 字段。

#### 在工作流中使用

需要在其他工作流里使用这个 Composite Action 时，只需在作业的步骤中引用它，就像使用 `@actions/checkout` 那样：

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Setup JS
        uses: so1ve/workflows/setup-js@main
        with:
          node-version: "22"
          package-manager: "pnpm"
```

### Reusable Workflows

接下来，我们创建一个 Reusable Workflow，用于执行常见的 CI/CD 任务，例如构建和测试项目。在 `so1ve/workflows` 仓库中创建一个新的工作流文件 `.github/workflows/conventional-ci.yml`，内容如下：

```yaml,.github/workflows/conventional-ci.yml
name: Conventional CI

on:
  workflow_call:
    inputs:
      node-versions:
        required: false
        type: string
        default: "22,24,25"

      typecheck:
        required: false
        type: string
        default: pnpm run typecheck

      lint:
        required: false
        type: string
        default: pnpm run lint

      build:
        required: false
        type: string
        default: pnpm run build

      test:
        required: false
        type: string
        default: pnpm run test

      skip-typecheck:
        required: false
        type: boolean
        default: false

      skip-lint:
        required: false
        type: boolean
        default: false

      skip-test:
        required: false
        type: boolean
        default: false

      build-for-lint:
        required: false
        type: boolean
        default: false

jobs:
  lint:
    runs-on: ubuntu-latest
    if: ${{ !inputs.skip-lint }}
    steps:
      - name: Setup JS
        uses: so1ve/workflows/setup-js@main

      - name: Build
        run: ${{ inputs.build }}
        if: ${{ inputs.build-for-lint }}

      - name: Lint
        run: ${{ inputs.lint }}
        if: ${{ inputs.lint != '' }}

  typecheck:
    runs-on: ubuntu-latest
    if: ${{ !inputs.skip-typecheck }}
    steps:
      - name: Setup JS
        uses: so1ve/workflows/setup-js@main

      - name: Type Check
        run: ${{ inputs.typecheck }}
        if: ${{ inputs.typecheck != '' }}

  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: ${{ fromJson(format('[{0}]', inputs.node-versions)) }}
      fail-fast: false

    if: ${{ !inputs.skip-test }}
    runs-on: ${{ matrix.os }}
    steps:
      - name: Setup JS
        uses: so1ve/workflows/setup-js@main
        with:
          node-version: ${{ matrix.node-version }}

      - name: Build
        run: ${{ inputs.build }}

      - name: Unit Test
        run: ${{ inputs.test }}
```


其中：

- `on.workflow_call` 定义了工作流的触发方式，这里使用 `workflow_call`，表示这个工作流可以被其他工作流调用。我们还定义了一些输入参数，例如 `node-versions` 用于指定测试的 Node.js 版本，`typecheck`、`lint`、`build`、`test` 分别用于指定类型检查、代码检查、构建和测试的命令。
- `jobs` 定义了工作流的作业，这里包含三个作业： `lint`、`typecheck` 和 `test`。

注意，这里我们使用了之前创建的 Composite Action `so1ve/workflows/setup-js@v1` 来初始化 JavaScript 环境。

#### 在工作流中使用

要在其他工作流中使用这个 Reusable Workflow，也是只需使用 `uses` 关键字引用它，并传递必要的输入参数。例如，在一个新的工作流文件 `.github/workflows/ci.yml` 中，我们可以这样使用：

```yaml,.github/workflows/ci.yml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  conventional-ci:
    uses: so1ve/workflows/.github/workflows/conventional-ci.yml@main
    with:
      node-versions: "22,24"
      skip-typecheck: true
      build-for-lint: true
```

## 版本管理

在使用 Reusable Workflows 和 Composite Actions 时，建议使用版本标签（例如 `v1.0.0`）而不是分支名称（例如 `main`）。这样可以确保工作流的稳定性，避免因为主分支的变更导致工作流出现问题。

可以手动打标签，也可以使用其他工具。我使用的是 [`bumpp`](https://github.com/antfu-collective/bumpp)。

同时还可以把代码推送到特定的分支上，例如 `v1`, `v2`，然后在工作流中引用这些分支。

```sh
git update-ref refs/heads/v1 refs/heads/main && git push origin v1 --force
```

然后在工作流中引用：

```yaml
uses: so1ve/workflows/.github/workflows/conventional-ci.yml@v1
```
