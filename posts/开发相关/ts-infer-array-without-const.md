---
published: 2023-05-13
---

# TypeScript 小寄巧！如何在不使用 const 泛型修饰符的情况下推导出列表字面量？

## 正文

在开始之前我们先来看几个代码片段：

```ts
const a = <T extends string>(t: T) => t;
const b = <T extends number>(t: T) => t;
const c = <T extends boolean>(t: T) => t;
```

此时我们这样调用它们，请问返回值的类型是什么？

```ts
const d = a("a");
const e = b(1);
const f = c(true);
```

好了不卖关子了，上面三个变量的类型分别是`"a"`，`1`和`true`。很符合直觉对吧？他们的参数都是字面量类型，因此泛型 T 也是对应的字面量，返回值 T 便是传入参数本身。

我们现在得到了这些能够从参数推导出字面量的函数，让我们把它推广到列表试试（[Playground 链接](https://www.typescriptlang.org/play?#code/MYewdgzgLgBA5jAvDAPAFRgUwB5U2AEwhmgCcBLMOAbQF0A+ACigC4Y0BKJemKAbgBQA0JFgALJPEbUARAEYFMgDQwZAJg0zaHPkA)）：

```ts
const g = <T extends string[]>(t: T) => t;

const h = g(["111", "222"]); // 寄，类型是string[]
```

奇怪，为什么类型是 `string[]` 而不是更为具体的 `["111", "222"]` 呢？或许是因为这个列表能够被函数体所修改罢，谁知道呢。

如果我们确实想让返回值的类型和传入参数的类型所匹配，但不想加上 `as const` 修饰符（因为它会让类型变为 `readonly ["111","222"]`），那我们怎么做呢？最近 TypeScript 5.0 的更新中加入了 `const` 泛型修饰符，能够在不用 `as const` 断言的情况下推导出字面量类型，然而它的结果也是 `readonly` ，这不是我们所想要的

其实你只需要做一些小小的改动（[Playground 链接](https://www.typescriptlang.org/play?#code/MYewdgzgLgBA5jAvDAPAFRgUwB5U2AEwhmgCcBLMOAbQF0A+ACigC4ZqA6LtWgSiXowoAbgBQo0JFgALJPEbUARAEZVigDQxFAJl2K+woA)）：

```ts
const g = <T extends string[]>(t: [...T]) => t; // 这里t的类型用了一个展开运算

const h = g(["111", "222"]); // 好，类型变成["111", "222"]了
```

就可以得到我们想要的结果。

不清楚为什么能这么用，不过用就完事了
