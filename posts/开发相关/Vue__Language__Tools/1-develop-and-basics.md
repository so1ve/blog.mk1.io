---
published: 2024-01-19
---

# Vue Language Tools 深度解析 (1)：Vue 编辑器插件发展历程及基本工作原理

作为一门独立的模板语言，编写 Vue SFC 时必不可少的就是像 TSX 一样的自动补全、错误提示等功能。而这些功能的实现离不开编辑器插件与语言服务器。自 Vue 诞生以来，有三个项目为 Vue 提供了语言功能 Vetur，VueDX 和本系列的主角 Vue Language Tools。本文将从历史的角度出发，介绍这三个项目的发展历程，以及 Vue Language Tools 的基本工作原理。

## Vetur

Vetur 在发布之初实际上并没有提供 `<template>` 块中的 JavaScript 语言功能，而是仅仅提供了 HTML 的补全。Katashin 提出了一个 [issue](https://github.com/vuejs/vetur/issues/209)，希望能够在 `<template>` 块中提供 JavaScript 的补全。Katashin 后来自己实现了一个简单的类型检查器 ([原文](https://github.com/vuejs/vetur/issues/209#issuecomment-306185954))，不过由于它没有复用 TypeScript 的类型检查器，所以它的功能非常有限。后来海老师提出了[一个思路](https://github.com/vuejs/vetur/issues/209#issuecomment-306365219)，即将 `<template>` 转换为等价的 TypeScript，然后让 TypeScript 的类型检查器来检查它，最后通过 SourceMap 将自动补全、错误提示等功能映射回 `<template>`。这个思路最终被采纳，也成为了日后所有 Vue 语言工具的基本工作原理。

Vetur 使用 `vue-eslint-parser` (`eslint-plugin-vue` 用的那个) 作为 SFC 解析器，然后遍历 `<template>` 中的 AST 节点，同时生成等价的 TS 代码 (称为 `Virtual Code`，虚拟代码)。Vetur 这里的代码生成用的是 TypeScript 的 API。具体的工作原理请见 [Pine 的文章](https://blog.matsu.io/generic-vue-template-interpolation-language-features)

## VueDX

VueDX 没有 Vetur 那么出名，不过两者的工作方式大致相同。VueDX 手写了一个轻量级的 SFC 解析器，然后将 `<template>` 转换为 TSX 代码，最后映射回 `<template>`。VueDX 的代码生成用的是 `@vue/compiler-dom` 的 API。

## Vue Language Tools

上面提到的两者都手写了 SourceMap 映射
