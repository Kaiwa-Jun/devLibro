// レビュー更新イベントを管理するクラス
class ReviewEventEmitter {
  private listeners: Map<string, Array<(data?: unknown) => void>> = new Map();

  // イベントリスナーを登録
  subscribe(event: string, callback: (data?: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const eventListeners = this.listeners.get(event)!;
    eventListeners.push(callback);

    // アンサブスクライブ用の関数を返す
    return () => {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    };
  }

  // イベント発火
  emit(event: string, data?: unknown): void {
    if (!this.listeners.has(event)) return;

    const eventListeners = this.listeners.get(event)!;
    eventListeners.forEach(callback => {
      callback(data);
    });
  }
}

// シングルトンインスタンス
export const reviewEvents = new ReviewEventEmitter();

// イベント名の定数
export const REVIEW_ADDED = 'review_added';
