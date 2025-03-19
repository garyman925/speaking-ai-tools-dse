/**
 * 存储服务类 - 处理录音存储
 */
class StorageService {
    constructor() {
        this.recordings = [];
    }

    /**
     * 添加录音
     * @param {Object} recording - 录音对象
     */
    addRecording(recording) {
        this.recordings.push(recording);
        return recording;
    }

    /**
     * 删除录音
     * @param {number} id - 录音ID
     */
    removeRecording(id) {
        this.recordings = this.recordings.filter(rec => rec.id !== id);
    }

    /**
     * 获取所有录音
     */
    getAllRecordings() {
        return this.recordings;
    }

    /**
     * 清除所有录音
     */
    clearRecordings() {
        this.recordings = [];
    }
}

// 导出单例
export default new StorageService(); 