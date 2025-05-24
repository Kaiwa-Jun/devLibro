/**
 * 文字列を指定した長さで切り詰めて、省略記号を追加する
 * @param text 切り詰める文字列
 * @param maxLength 最大文字数（デフォルト: 8）
 * @param ellipsis 省略記号（デフォルト: "..."）
 * @returns 切り詰められた文字列
 */
export function truncateText(
  text: string,
  maxLength: number = 8,
  ellipsis: string = '...'
): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength) + ellipsis;
}

/**
 * ユーザー名を表示用に省略する（8文字 + "..."）
 * @param userName ユーザー名
 * @returns 省略されたユーザー名
 */
export function truncateUserName(userName: string): string {
  return truncateText(userName, 8);
}
