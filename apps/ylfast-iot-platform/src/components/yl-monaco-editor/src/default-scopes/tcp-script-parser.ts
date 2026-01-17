export default `
/**
 * Vert.x Buffer 接口：用于 Vert.x 中数据传输的字节缓冲区
 * 可自动扩容，支持各种基础类型的读写操作
 */
interface Buffer {
  /**
   * 返回 Buffer 的 UTF-8 编码字符串表示
   */
  toString(): string;

  /**
   * 返回指定编码的字符串表示
   * @param enc 编码格式（如 "UTF-8", "GBK" 等）
   */
  toString(enc: string): string;

  /**
   * 将 Buffer 内容转换为 JsonObject
   */
  toJsonObject(): any; // 适配 Vert.x JsonObject，实际项目可替换为具体类型

  /**
   * 将 Buffer 内容转换为 JsonArray
   */
  toJsonArray(): any; // 适配 Vert.x JsonArray，实际项目可替换为具体类型

  /**
   * 将 Buffer 内容转换为任意 JSON 类型值
   */
  toJsonValue(): any;

  /**
   * @deprecated 请使用 toJsonValue()
   */
  toJson(): any;

  /**
   * 获取指定位置的字节
   * @param pos 位置索引（从0开始）
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getByte(pos: number): number; // byte → number (0-255)

  /**
   * 获取指定位置的无符号字节（返回 short 类型，对应 TS number）
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getUnsignedByte(pos: number): number;

  /**
   * 获取指定位置的 int 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出（需要 4 字节空间）
   */
  getInt(pos: number): number;

  /**
   * 以小端序获取指定位置的 int 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getIntLE(pos: number): number;

  /**
   * 获取指定位置的无符号 int 类型值（返回 long 类型，对应 TS number/bigint）
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getUnsignedInt(pos: number): number | bigint;

  /**
   * 以小端序获取指定位置的无符号 int 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getUnsignedIntLE(pos: number): number | bigint;

  /**
   * 获取指定位置的 long 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出（需要 8 字节空间）
   */
  getLong(pos: number): number | bigint;

  /**
   * 以小端序获取指定位置的 long 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getLongLE(pos: number): number | bigint;

  /**
   * 获取指定位置的 double 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出（需要 8 字节空间）
   */
  getDouble(pos: number): number;

  /**
   * 获取指定位置的 float 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出（需要 4 字节空间）
   */
  getFloat(pos: number): number;

  /**
   * 获取指定位置的 short 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出（需要 2 字节空间）
   */
  getShort(pos: number): number;

  /**
   * 以小端序获取指定位置的 short 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getShortLE(pos: number): number;

  /**
   * 获取指定位置的无符号 short 类型值（返回 int 类型，对应 TS number）
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getUnsignedShort(pos: number): number;

  /**
   * 以小端序获取指定位置的无符号 short 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getUnsignedShortLE(pos: number): number;

  /**
   * 获取指定位置的 24 位 medium 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出（需要 3 字节空间）
   */
  getMedium(pos: number): number;

  /**
   * 以小端序获取指定位置的 24 位 medium 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getMediumLE(pos: number): number;

  /**
   * 获取指定位置的无符号 24 位 medium 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getUnsignedMedium(pos: number): number;

  /**
   * 以小端序获取指定位置的无符号 24 位 medium 类型值
   * @param pos 位置索引
   * @throws IndexOutOfBoundsException 索引越界时抛出
   */
  getUnsignedMediumLE(pos: number): number;

  /**
   * 将整个 Buffer 内容复制为字节数组
   */
  getBytes(): Uint8Array; // byte[] → Uint8Array（TS 原生字节数组）

  /**
   * 将 Buffer 中 [start, end) 区间的内容复制为字节数组
   * @param start 起始位置（包含）
   * @param end 结束位置（不包含）
   */
  getBytes(start: number, end: number): Uint8Array;

  /**
   * 将 Buffer 内容写入目标字节数组
   * @param dst 目标字节数组
   * @throws IndexOutOfBoundsException 目标数组空间不足时抛出
   */
  getBytes(dst: Uint8Array): Buffer;

  /**
   * 将 Buffer 内容写入目标字节数组的指定位置
   * @param dst 目标字节数组
   * @param dstIndex 目标数组起始索引
   * @throws IndexOutOfBoundsException 目标数组空间不足时抛出
   */
  getBytes(dst: Uint8Array, dstIndex: number): Buffer;

  /**
   * 将 Buffer 中 [start, end) 区间的内容写入目标字节数组
   * @param start Buffer 起始位置
   * @param end Buffer 结束位置
   * @param dst 目标字节数组
   * @throws IndexOutOfBoundsException 目标数组空间不足时抛出
   */
  getBytes(start: number, end: number, dst: Uint8Array): Buffer;

  /**
   * 将 Buffer 中 [start, end) 区间的内容写入目标字节数组的指定位置
   * @param start Buffer 起始位置
   * @param end Buffer 结束位置
   * @param dst 目标字节数组
   * @param dstIndex 目标数组起始索引
   * @throws IndexOutOfBoundsException 目标数组空间不足时抛出
   */
  getBytes(start: number, end: number, dst: Uint8Array, dstIndex: number): Buffer;

  /**
   * 获取 Buffer 中 [start, end) 区间的子缓冲区（副本）
   * @param start 起始位置
   * @param end 结束位置
   */
  getBuffer(start: number, end: number): Buffer;

  /**
   * 将 Buffer 中 [start, end) 区间的内容转换为指定编码的字符串
   * @param start 起始位置
   * @param end 结束位置
   * @param enc 编码格式
   */
  getString(start: number, end: number, enc: string): string;

  /**
   * 将 Buffer 中 [start, end) 区间的内容转换为 UTF-8 编码的字符串
   * @param start 起始位置
   * @param end 结束位置
   */
  getString(start: number, end: number): string;

  /**
   * 追加另一个 Buffer 到当前 Buffer 末尾
   * @param buff 要追加的 Buffer
   * @returns 当前 Buffer 实例（链式调用）
   */
  appendBuffer(buff: Buffer): Buffer;

  /**
   * 追加另一个 Buffer 的指定区间到当前 Buffer 末尾
   * @param buff 要追加的 Buffer
   * @param offset 起始偏移量
   * @param len 追加长度
   * @returns 当前 Buffer 实例
   */
  appendBuffer(buff: Buffer, offset: number, len: number): Buffer;

  /**
   * 追加字节数组到当前 Buffer 末尾
   * @param bytes 字节数组
   * @returns 当前 Buffer 实例
   */
  appendBytes(bytes: Uint8Array): Buffer;

  /**
   * 追加字节数组的指定区间到当前 Buffer 末尾
   * @param bytes 字节数组
   * @param offset 起始偏移量
   * @param len 追加长度
   * @returns 当前 Buffer 实例
   */
  appendBytes(bytes: Uint8Array, offset: number, len: number): Buffer;

  /**
   * 追加单个字节到 Buffer 末尾
   * @param b 字节值（0-255）
   * @returns 当前 Buffer 实例
   */
  appendByte(b: number): Buffer;

  /**
   * 追加无符号字节到 Buffer 末尾
   * @param b 无符号字节值
   * @returns 当前 Buffer 实例
   */
  appendUnsignedByte(b: number): Buffer;

  /**
   * 追加 int 类型值到 Buffer 末尾
   * @param i int 值
   * @returns 当前 Buffer 实例
   */
  appendInt(i: number): Buffer;

  /**
   * 以小端序追加 int 类型值到 Buffer 末尾
   * @param i int 值
   * @returns 当前 Buffer 实例
   */
  appendIntLE(i: number): Buffer;

  /**
   * 追加无符号 int 类型值到 Buffer 末尾
   * @param i 无符号 int 值
   * @returns 当前 Buffer 实例
   */
  appendUnsignedInt(i: number | bigint): Buffer;

  /**
   * 以小端序追加无符号 int 类型值到 Buffer 末尾
   * @param i 无符号 int 值
   * @returns 当前 Buffer 实例
   */
  appendUnsignedIntLE(i: number | bigint): Buffer;

  /**
   * 追加 24 位 medium 类型值到 Buffer 末尾
   * @param i medium 值
   * @returns 当前 Buffer 实例
   */
  appendMedium(i: number): Buffer;

  /**
   * 以小端序追加 24 位 medium 类型值到 Buffer 末尾
   * @param i medium 值
   * @returns 当前 Buffer 实例
   */
  appendMediumLE(i: number): Buffer;

  /**
   * 追加 long 类型值到 Buffer 末尾
   * @param l long 值
   * @returns 当前 Buffer 实例
   */
  appendLong(l: number | bigint): Buffer;

  /**
   * 以小端序追加 long 类型值到 Buffer 末尾
   * @param l long 值
   * @returns 当前 Buffer 实例
   */
  appendLongLE(l: number | bigint): Buffer;

  /**
   * 追加 short 类型值到 Buffer 末尾
   * @param s short 值
   * @returns 当前 Buffer 实例
   */
  appendShort(s: number): Buffer;

  /**
   * 以小端序追加 short 类型值到 Buffer 末尾
   * @param s short 值
   * @returns 当前 Buffer 实例
   */
  appendShortLE(s: number): Buffer;

  /**
   * 追加无符号 short 类型值到 Buffer 末尾
   * @param s 无符号 short 值
   * @returns 当前 Buffer 实例
   */
  appendUnsignedShort(s: number): Buffer;

  /**
   * 以小端序追加无符号 short 类型值到 Buffer 末尾
   * @param s 无符号 short 值
   * @returns 当前 Buffer 实例
   */
  appendUnsignedShortLE(s: number): Buffer;

  /**
   * 追加 float 类型值到 Buffer 末尾
   * @param f float 值
   * @returns 当前 Buffer 实例
   */
  appendFloat(f: number): Buffer;

  /**
   * 追加 double 类型值到 Buffer 末尾
   * @param d double 值
   * @returns 当前 Buffer 实例
   */
  appendDouble(d: number): Buffer;

  /**
   * 追加指定编码的字符串到 Buffer 末尾
   * @param str 字符串
   * @param enc 编码格式
   * @returns 当前 Buffer 实例
   */
  appendString(str: string, enc: string): Buffer;

  /**
   * 追加 UTF-8 编码的字符串到 Buffer 末尾
   * @param str 字符串
   * @returns 当前 Buffer 实例
   */
  appendString(str: string): Buffer;

  /**
   * 设置指定位置的字节值
   * @param pos 位置索引
   * @param b 字节值
   * @returns 当前 Buffer 实例
   */
  setByte(pos: number, b: number): Buffer;

  /**
   * 设置指定位置的无符号字节值
   * @param pos 位置索引
   * @param b 无符号字节值
   * @returns 当前 Buffer 实例
   */
  setUnsignedByte(pos: number, b: number): Buffer;

  /**
   * 设置指定位置的 int 类型值
   * @param pos 位置索引
   * @param i int 值
   * @returns 当前 Buffer 实例
   */
  setInt(pos: number, i: number): Buffer;

  /**
   * 以小端序设置指定位置的 int 类型值
   * @param pos 位置索引
   * @param i int 值
   * @returns 当前 Buffer 实例
   */
  setIntLE(pos: number, i: number): Buffer;

  /**
   * 设置指定位置的无符号 int 类型值
   * @param pos 位置索引
   * @param i 无符号 int 值
   * @returns 当前 Buffer 实例
   */
  setUnsignedInt(pos: number, i: number | bigint): Buffer;

  /**
   * 以小端序设置指定位置的无符号 int 类型值
   * @param pos 位置索引
   * @param i 无符号 int 值
   * @returns 当前 Buffer 实例
   */
  setUnsignedIntLE(pos: number, i: number | bigint): Buffer;

  /**
   * 设置指定位置的 24 位 medium 类型值
   * @param pos 位置索引
   * @param i medium 值
   * @returns 当前 Buffer 实例
   */
  setMedium(pos: number, i: number): Buffer;

  /**
   * 以小端序设置指定位置的 24 位 medium 类型值
   * @param pos 位置索引
   * @param i medium 值
   * @returns 当前 Buffer 实例
   */
  setMediumLE(pos: number, i: number): Buffer;

  /**
   * 设置指定位置的 long 类型值
   * @param pos 位置索引
   * @param l long 值
   * @returns 当前 Buffer 实例
   */
  setLong(pos: number, l: number | bigint): Buffer;

  /**
   * 以小端序设置指定位置的 long 类型值
   * @param pos 位置索引
   * @param l long 值
   * @returns 当前 Buffer 实例
   */
  setLongLE(pos: number, l: number | bigint): Buffer;

  /**
   * 设置指定位置的 double 类型值
   * @param pos 位置索引
   * @param d double 值
   * @returns 当前 Buffer 实例
   */
  setDouble(pos: number, d: number): Buffer;

  /**
   * 设置指定位置的 float 类型值
   * @param pos 位置索引
   * @param f float 值
   * @returns 当前 Buffer 实例
   */
  setFloat(pos: number, f: number): Buffer;

  /**
   * 设置指定位置的 short 类型值
   * @param pos 位置索引
   * @param s short 值
   * @returns 当前 Buffer 实例
   */
  setShort(pos: number, s: number): Buffer;

  /**
   * 以小端序设置指定位置的 short 类型值
   * @param pos 位置索引
   * @param s short 值
   * @returns 当前 Buffer 实例
   */
  setShortLE(pos: number, s: number): Buffer;

  /**
   * 设置指定位置的无符号 short 类型值
   * @param pos 位置索引
   * @param s 无符号 short 值
   * @returns 当前 Buffer 实例
   */
  setUnsignedShort(pos: number, s: number): Buffer;

  /**
   * 以小端序设置指定位置的无符号 short 类型值
   * @param pos 位置索引
   * @param s 无符号 short 值
   * @returns 当前 Buffer 实例
   */
  setUnsignedShortLE(pos: number, s: number): Buffer;

  /**
   * 将另一个 Buffer 的内容设置到当前 Buffer 的指定位置
   * @param pos 目标位置索引
   * @param b 源 Buffer
   * @returns 当前 Buffer 实例
   */
  setBuffer(pos: number, b: Buffer): Buffer;

  /**
   * 将另一个 Buffer 的指定区间内容设置到当前 Buffer 的指定位置
   * @param pos 目标位置索引
   * @param b 源 Buffer
   * @param offset 源 Buffer 起始偏移量
   * @param len 复制长度
   * @returns 当前 Buffer 实例
   */
  setBuffer(pos: number, b: Buffer, offset: number, len: number): Buffer;

  /**
   * 将 ByteBuffer 内容设置到当前 Buffer 的指定位置
   * @param pos 目标位置索引
   * @param b ByteBuffer（TS 中用 ArrayBuffer 适配）
   * @returns 当前 Buffer 实例
   */
  setBytes(pos: number, b: ArrayBuffer): Buffer;

  /**
   * 将字节数组内容设置到当前 Buffer 的指定位置
   * @param pos 目标位置索引
   * @param b 字节数组
   * @returns 当前 Buffer 实例
   */
  setBytes(pos: number, b: Uint8Array): Buffer;

  /**
   * 将字节数组的指定区间内容设置到当前 Buffer 的指定位置
   * @param pos 目标位置索引
   * @param b 字节数组
   * @param offset 源数组起始偏移量
   * @param len 复制长度
   * @returns 当前 Buffer 实例
   */
  setBytes(pos: number, b: Uint8Array, offset: number, len: number): Buffer;

  /**
   * 将 UTF-8 编码的字符串设置到当前 Buffer 的指定位置
   * @param pos 目标位置索引
   * @param str 字符串
   * @returns 当前 Buffer 实例
   */
  setString(pos: number, str: string): Buffer;

  /**
   * 将指定编码的字符串设置到当前 Buffer 的指定位置
   * @param pos 目标位置索引
   * @param str 字符串
   * @param enc 编码格式
   * @returns 当前 Buffer 实例
   */
  setString(pos: number, str: string, enc: string): Buffer;

  /**
   * 获取 Buffer 的字节长度
   */
  length(): number;

  /**
   * 创建当前 Buffer 的完整副本
   */
  copy(): Buffer;

  /**
   * 创建当前 Buffer 的切片（共享底层数据，索引独立）
   */
  slice(): Buffer;

  /**
   * 创建当前 Buffer 指定区间的切片（共享底层数据，索引独立）
   * @param start 起始位置
   * @param end 结束位置
   */
  slice(start: number, end: number): Buffer;

  /**
   * @deprecated Vert.x 5 中已移除，返回 Netty ByteBuf（TS 中无对应类型，标记为废弃）
   */
  getByteBuf(): any;
}

/**
 * Buffer 静态工厂方法（对应 Java 静态方法）
 */
namespace Buffer {
  /**
   * 创建空 Buffer
   */
  function buffer(): Buffer;

  /**
   * 根据初始大小创建 Buffer
   * @param initialSizeHint 初始大小（字节）
   */
  function buffer(initialSizeHint: number): Buffer;

  /**
   * 从 UTF-8 编码的字符串创建 Buffer
   * @param string 字符串
   */
  function buffer(string: string): Buffer;

  /**
   * 从指定编码的字符串创建 Buffer
   * @param string 字符串
   * @param enc 编码格式
   */
  function buffer(string: string, enc: string): Buffer;

  /**
   * 从字节数组创建 Buffer（复制数据）
   * @param bytes 字节数组
   */
  function buffer(bytes: Uint8Array): Buffer;

  /**
   * @deprecated Vert.x 5 中已移除，从 Netty ByteBuf 创建 Buffer
   * @param byteBuf Netty ByteBuf
   */
  function buffer(byteBuf: any): Buffer;
}

interface PayloadParser {
    /** 设置固定长度解析模式 */
    fixed(size: number): PayloadParser;
    /** 设置定界符解析模式 */
    delimited(delimited: string): PayloadParser;
    /** 注入处理逻辑 */
    handler(callback: (buffer: Buffer, parser: PayloadParser) => void): PayloadParser;
    /** 设置解析结果 */
    result(buffer: any): PayloadParser;
    /** 完成解析并重置 */
    complete(): PayloadParser;
    /** 创建新 Buffer */
    newBuffer(): Buffer;
    /** 直接解析 */
    direct(callback:(buffer: Buffer) => Buffer): PayloadParser;
    
}

/** Payload Parser Instance */
declare var parser: PayloadParser;

`;
