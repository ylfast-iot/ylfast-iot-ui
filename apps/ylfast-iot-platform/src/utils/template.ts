/**
 * 可自定义分隔符的模板字符串解析方法
 * @param template 模板字符串（如："您好，${name}！"）
 * @param data 数据源对象
 * @param options 自定义配置（分隔符）
 * @param options.start 变量起始分隔符，默认 {{
 * @param options.end 变量结束分隔符，默认 }}
 * @returns 解析后的字符串
 */
export function parseTemplate(
  template: string,
  data: Record<string, any> = {},
  options: { end?: string; start?: string } = {},
): string {
  // 默认分隔符 {{ }}，可通过 options 自定义
  const { start = '{', end = '}' } = options;

  // 转义分隔符（处理特殊字符如 $、(、) 等）
  const escapeReg = (str: string) =>
    str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  const startReg = escapeReg(start);
  const endReg = escapeReg(end);

  // 构建匹配正则（支持嵌套变量、分隔符内空格）
  const reg = new RegExp(`${startReg}\\s*([\\w\\.\\[\\]]+)\\s*${endReg}`, 'g');

  // 替换所有变量占位符
  return template.replace(reg, (_match, varPath) => {
    // 解析嵌套路径（如 list[0].name → ['list', '0', 'name']）
    const pathArr = varPath
      .trim()
      .replaceAll(/\[(\d+)\]/g, '.$1')
      .split('.');

    // 逐层获取对象属性值
    // eslint-disable-next-line unicorn/no-array-reduce
    const value = pathArr.reduce((obj: any, key: string) => {
      return obj && obj[key] !== undefined ? obj[key] : '';
    }, data);

    // 空值处理为空字符串，非字符串转为字符串
    return value === undefined || value === null ? '' : String(value);
  });
}
