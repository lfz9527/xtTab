export default {
  // 最大行长规则通常设置为 100 或 120。
  printWidth: 80,
  // 指定每个标签缩进级别的空格数。
  tabWidth: 2,
  // 使用制表符而不是空格缩进行。
  useTabs: false,
  // true（默认）: 在每条语句的末尾添加一个分号。false：仅在可能导致 ASI 失败的行的开头添加分号。
  semi: false,
  // 使用单引号而不是双引号
  singleQuote: true,
  // 引用对象中的属性时，仅在需要时在对象属性周围添加引号。
  quoteProps: 'as-needed',
  // 在对象文字中的括号之间打印空格。
  bracketSpacing: true,
  // "none":没有尾随逗号。"es5": 在 ES5 中有效的尾随逗号（对象、数组等），TypeScript 中的类型参数中没有尾随逗号。"all"- 尽可能使用尾随逗号。
  trailingComma: 'none',
  // 将>多行 HTML（HTML、JSX、Vue、Angular）元素放在最后一行的末尾，而不是单独放在下一行（不适用于自闭合元素）。
  bracketSameLine: false,
  jsxSingleQuote: true,
  // 在唯一的箭头函数参数周围始终包含括号。
  arrowParens: 'always',
  insertPragma: false,
  requirePragma: false,
  proseWrap: 'never',
  // 使用 Windows 风格的换行符 (\r\n)
  endOfLine: 'lf',
  // 格式化文件时，回到包含所选语句的第一行的开头。
  rangeStart: 0
}
