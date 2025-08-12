/**
 * 缓存管理器 - 解决浏览器缓存问题
 * 提供强制刷新、版本控制等功能
 */

// 避免重复声明
if (typeof window.CacheManager === 'undefined') {
    window.CacheManager = class CacheManager {
    constructor() {
        this.version = new Date().getTime();
        this.init();
    }

    /**
     * 初始化缓存管理器
     */
    init() {
        // 检查是否需要强制刷新
        this.checkForceRefresh();
        
        // 设置页面卸载时的缓存清理
        this.setupPageUnloadHandler();
        
        // 添加手动刷新按钮
        this.addRefreshButton();
        
        // 监听存储变化
        this.setupStorageListener();
    }

    /**
     * 检查是否需要强制刷新
     */
    checkForceRefresh() {
        const urlParams = new URLSearchParams(window.location.search);
        const forceRefresh = urlParams.get('refresh');
        const lastVersion = localStorage.getItem('app_version');
        
        if (forceRefresh === 'true' || !lastVersion || lastVersion !== this.version.toString()) {
            console.log('检测到版本更新或强制刷新，清理缓存...');
            this.clearAllCache();
            localStorage.setItem('app_version', this.version.toString());
        }
    }

    /**
     * 清理所有缓存
     */
    clearAllCache() {
        // 清理localStorage中的测试数据缓存
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('test_') || key.startsWith('cache_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // 清理sessionStorage
        sessionStorage.clear();
        
        console.log('缓存已清理');
    }

    /**
     * 强制刷新页面
     */
    forceRefresh() {
        // 添加时间戳参数强制刷新
        const url = new URL(window.location);
        url.searchParams.set('refresh', 'true');
        url.searchParams.set('t', new Date().getTime());
        
        // 清理缓存后刷新
        this.clearAllCache();
        window.location.href = url.toString();
    }

    /**
     * 获取带版本号的资源URL
     */
    getVersionedUrl(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}v=${this.version}`;
    }

    /**
     * 动态加载带版本号的脚本
     */
    loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = this.getVersionedUrl(src);
        script.onload = callback;
        script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
        };
        document.head.appendChild(script);
    }

    /**
     * 动态加载带版本号的样式表
     */
    loadStylesheet(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.getVersionedUrl(href);
        document.head.appendChild(link);
    }

    /**
     * 设置页面卸载处理器
     */
    setupPageUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            // 标记页面正在卸载
            sessionStorage.setItem('page_unloading', 'true');
        });

        window.addEventListener('pageshow', (event) => {
            // 如果是从缓存中恢复的页面，强制刷新
            if (event.persisted) {
                console.log('检测到页面从缓存恢复，强制刷新...');
                this.forceRefresh();
            }
            sessionStorage.removeItem('page_unloading');
        });
    }

    /**
     * 添加手动刷新按钮
     */
    addRefreshButton() {
        // 创建刷新按钮
        const refreshBtn = document.createElement('button');
        refreshBtn.innerHTML = '🔄 强制刷新';
        refreshBtn.className = 'cache-refresh-btn';
        refreshBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            padding: 8px 12px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        
        refreshBtn.addEventListener('click', () => {
            this.forceRefresh();
        });
        
        // 添加到页面
        document.body.appendChild(refreshBtn);
        
        // 添加悬停效果
        refreshBtn.addEventListener('mouseenter', () => {
            refreshBtn.style.background = '#0056b3';
        });
        
        refreshBtn.addEventListener('mouseleave', () => {
            refreshBtn.style.background = '#007bff';
        });
    }

    /**
     * 设置存储监听器
     */
    setupStorageListener() {
        window.addEventListener('storage', (event) => {
            if (event.key === 'force_refresh' && event.newValue === 'true') {
                console.log('检测到其他标签页请求刷新');
                localStorage.removeItem('force_refresh');
                this.forceRefresh();
            }
        });
    }

    /**
     * 通知所有标签页刷新
     */
    notifyAllTabsRefresh() {
        localStorage.setItem('force_refresh', 'true');
        setTimeout(() => {
            localStorage.removeItem('force_refresh');
        }, 1000);
    }

    /**
     * 检查数据是否需要更新
     */
    checkDataUpdate() {
        const lastUpdate = localStorage.getItem('last_data_update');
        const currentTime = new Date().getTime();
        
        // 如果超过5分钟没有更新，提示用户刷新
        if (lastUpdate && (currentTime - parseInt(lastUpdate)) > 5 * 60 * 1000) {
            this.showUpdateNotification();
        }
        
        localStorage.setItem('last_data_update', currentTime.toString());
    }

    /**
     * 显示更新通知
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 50px;
                right: 10px;
                background: #ffc107;
                color: #212529;
                padding: 12px 16px;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 300px;
                font-size: 14px;
            ">
                <strong>数据可能已更新</strong><br>
                建议刷新页面获取最新数据
                <button onclick="window.cacheManager.forceRefresh()" style="
                    margin-left: 8px;
                    padding: 4px 8px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                ">立即刷新</button>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    margin-left: 4px;
                    padding: 4px 8px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 2px;
                    cursor: pointer;
                ">忽略</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 10秒后自动消失
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
    }
}

// 创建全局缓存管理器实例（避免重复创建）
if (typeof window.cacheManager === 'undefined') {
    window.cacheManager = new window.CacheManager();
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CacheManager;
}