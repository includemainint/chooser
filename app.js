// 数据管理
const LunchOptions = {
    // 获取所有选项
    getAll() {
        const options = localStorage.getItem('lunchOptions');
        return options ? JSON.parse(options) : [];
    },
    
    // 添加新选项
    add(option) {
        const options = this.getAll();
        options.push({
            id: Date.now().toString(),
            ...option,
            lastEaten: null
        });
        localStorage.setItem('lunchOptions', JSON.stringify(options));
        return options;
    },
    
    // 删除选项
    delete(id) {
        let options = this.getAll();
        options = options.filter(option => option.id !== id);
        localStorage.setItem('lunchOptions', JSON.stringify(options));
        return options;
    },
    
    // 更新选项的lastEaten状态
    markAsEaten(id) {
        let options = this.getAll();
        options = options.map(option => {
            if (option.id === id) {
                return { ...option, lastEaten: new Date().toISOString() };
            }
            return option;
        });
        localStorage.setItem('lunchOptions', JSON.stringify(options));
        return options;
    },
    
    // 随机选择一个选项
    chooseRandom() {
        const options = this.getAll();
        if (options.length === 0) return null;
        return options[Math.floor(Math.random() * options.length)];
    },
    
    // 导入外部选项（用于共享功能）
    importOptions(externalOptions) {
        const existingOptions = this.getAll();
        let newCount = 0;
        
        // 过滤掉已存在的选项（根据名称判断）
        const newOptions = externalOptions.filter(extOpt => {
            return !existingOptions.some(existing => existing.name === extOpt.name);
        });
        
        // 添加新选项
        newOptions.forEach(opt => {
            this.add({
                name: opt.name,
                type: opt.type || '其他',
                distance: opt.distance || 0,
                isFavorite: opt.isFavorite || false
            });
            newCount++;
        });
        
        return newCount;
    }
};

// 共享功能
const ShareManager = {
    // 生成共享链接
    generateShareLink() {
        const options = LunchOptions.getAll();
        if (options.length === 0) {
            alert("请先添加午餐选项再共享");
            return null;
        }
        
        try {
            // 准备要共享的数据（过滤掉不必要的字段）
            const shareData = options.map(opt => ({
                name: opt.name,
                type: opt.type,
                distance: opt.distance,
                isFavorite: opt.isFavorite
            }));
            
            // 编码数据
            const jsonStr = JSON.stringify(shareData);
            const encodedData = btoa(encodeURIComponent(jsonStr));
            
            // 生成包含数据的链接
            const shareLink = `${window.location.origin}${window.location.pathname}?share=${encodedData}`;
            
            return shareLink;
        } catch (e) {
            console.error("生成共享链接失败:", e);
            alert("生成共享链接失败，请稍后再试");
            return null;
        }
    },
    
    // 检查URL中是否有共享数据并处理
    checkAndImportSharedData() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedData = urlParams.get('share');
        
        if (sharedData) {
            try {
                // 解码并解析数据
                const decodedData = decodeURIComponent(atob(sharedData));
                const options = JSON.parse(decodedData);
                
                if (Array.isArray(options) && options.length > 0) {
                    // 询问用户是否导入数据
                    if (confirm(`检测到共享的午餐列表，包含 ${options.length} 个选项，是否导入到你的列表中？`)) {
                        const newCount = LunchOptions.importOptions(options);
                        renderOptions();
                        alert(`成功导入 ${newCount} 个新的午餐选项`);
                        
                        // 清除URL中的共享参数，避免重复导入
                        history.replaceState(null, null, window.location.pathname);
                    }
                }
            } catch (e) {
                console.error("解析共享数据失败:", e);
                alert("共享链接无效或已损坏");
            }
        }
    }
};

// DOM 元素
const elements = {
    chooseBtn: document.getElementById('chooseBtn'),
    addBtn: document.getElementById('addBtn'),
    shareBtn: document.getElementById('shareBtn'),
    shareModal: document.getElementById('shareModal'),
    closeShareModal: document.getElementById('closeShareModal'),
    closeShareBtn: document.getElementById('closeShareBtn'),
    shareLinkInput: document.getElementById('shareLinkInput'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    addModal: document.getElementById('addModal'),
    closeAddModal: document.getElementById('closeAddModal'),
    addForm: document.getElementById('addForm'),
    optionsList: document.getElementById('optionsList'),
    emptyState: document.getElementById('emptyState'),
    countBadge: document.getElementById('countBadge'),
    resultText: document.getElementById('resultText'),
    animationContainer: document.getElementById('animationContainer'),
    resultContainer: document.getElementById('resultContainer'),
    infoBtn: document.getElementById('infoBtn'),
    infoModal: document.getElementById('infoModal'),
    closeInfoBtn: document.getElementById('closeInfoBtn'),
    gotItBtn: document.getElementById('gotItBtn')
};

// 渲染选项列表
function renderOptions() {
    const options = LunchOptions.getAll();
    
    // 更新计数
    elements.countBadge.textContent = options.length;
    
    // 显示空状态或列表
    if (options.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.optionsList.classList.add('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.optionsList.classList.remove('hidden');
    
    // 清空列表
    elements.optionsList.innerHTML = '';
    
    // 添加所有选项
    options.forEach(option => {
        const li = document.createElement('li');
        li.className = `flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors`;
        
        // 选项信息
        const infoDiv = document.createElement('div');
        infoDiv.className = 'mb-2 sm:mb-0';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = `font-medium ${option.lastEaten ? 'text-gray-400 line-through' : 'text-gray-800'}`;
        nameSpan.textContent = option.name;
        
        const metaSpan = document.createElement('div');
        metaSpan.className = 'text-sm text-gray-500 mt-1';
        metaSpan.innerHTML = `
            <span class="inline-block mr-3"><i class="fa fa-cutlery mr-1"></i>${option.type}</span>
            <span class="inline-block"><i class="fa fa-map-marker mr-1"></i>${option.distance}米</span>
            ${option.isFavorite ? '<span class="ml-3 text-accent"><i class="fa fa-star"></i></span>' : ''}
            ${option.lastEaten ? `<span class="ml-3 text-xs text-gray-400">最近吃过</span>` : ''}
        `;
        
        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(metaSpan);
        
        // 操作按钮
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex space-x-2';
        
        const eatBtn = document.createElement('button');
        eatBtn.className = `p-2 text-sm ${option.lastEaten ? 'text-gray-300 cursor-not-allowed' : 'text-secondary hover:text-secondary/80'}`;
        eatBtn.innerHTML = '<i class="fa fa-check"></i> 吃过';
        eatBtn.disabled = !!option.lastEaten;
        eatBtn.addEventListener('click', () => {
            LunchOptions.markAsEaten(option.id);
            renderOptions();
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'p-2 text-sm text-red-500 hover:text-red-600';
        deleteBtn.innerHTML = '<i class="fa fa-trash"></i> 删除';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`确定要删除"${option.name}"吗？`)) {
                LunchOptions.delete(option.id);
                renderOptions();
            }
        });
        
        actionsDiv.appendChild(eatBtn);
        actionsDiv.appendChild(deleteBtn);
        
        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);
        
        elements.optionsList.appendChild(li);
    });
}

// 选择午餐
function chooseLunch() {
    const options = LunchOptions.getAll();
    if (options.length === 0) {
        alert('请先添加午餐选项');
        return;
    }
    
    // 显示动画
    elements.resultText.classList.add('hidden');
    elements.animationContainer.classList.remove('hidden');
    elements.chooseBtn.disabled = true;
    elements.chooseBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> 选择中...';
    elements.chooseBtn.classList.add('opacity-70', 'cursor-not-allowed');
    
    // 延迟一段时间后显示结果，增加悬念
    setTimeout(() => {
        const chosen = LunchOptions.chooseRandom();
        
        // 隐藏动画，显示结果
        elements.animationContainer.classList.add('hidden');
        elements.resultText.classList.remove('hidden');
        
        // 构建结果HTML
        let resultHtml = `
            <div class="text-center">
                <h3 class="text-2xl font-bold text-gray-800 mb-2">${chosen.name}</h3>
                <div class="text-gray-600 mb-3">
                    <span class="inline-block mr-3"><i class="fa fa-cutlery mr-1"></i>${chosen.type}</span>
                    <span class="inline-block"><i class="fa fa-map-marker mr-1"></i>${chosen.distance}米</span>
                    ${chosen.isFavorite ? '<span class="ml-3 text-accent"><i class="fa fa-star"></i> 喜爱</span>' : ''}
                </div>
                <button onclick="LunchOptions.markAsEaten('${chosen.id}'); renderOptions();" 
                        class="bg-secondary hover:bg-secondary/90 text-white text-sm py-1 px-3 rounded-md transition-colors">
                    <i class="fa fa-check mr-1"></i> 标记为已吃
                </button>
            </div>
        `;
        
        elements.resultText.innerHTML = resultHtml;
        
        // 恢复按钮状态
        elements.chooseBtn.disabled = false;
        elements.chooseBtn.innerHTML = '<i class="fa fa-refresh mr-2"></i> 再选一次';
        elements.chooseBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        
        // 添加结果动画效果
        elements.resultContainer.classList.add('animate-pulse');
        setTimeout(() => {
            elements.resultContainer.classList.remove('animate-pulse');
        }, 1000);
        
    }, 2000); // 2秒动画
}

// 事件监听
function setupEventListeners() {
    // 选择按钮
    elements.chooseBtn.addEventListener('click', chooseLunch);
    
    // 添加选项按钮
    elements.addBtn.addEventListener('click', () => {
        elements.addModal.classList.remove('hidden');
        elements.addForm.reset();
        document.getElementById('name').focus();
    });
    
    // 共享按钮
    elements.shareBtn.addEventListener('click', () => {
        const shareLink = ShareManager.generateShareLink();
        if (shareLink) {
            elements.shareLinkInput.value = shareLink;
            elements.shareModal.classList.remove('hidden');
        }
    });
    
    // 关闭共享模态框
    elements.closeShareModal.addEventListener('click', () => {
        elements.shareModal.classList.add('hidden');
    });
    
    elements.closeShareBtn.addEventListener('click', () => {
        elements.shareModal.classList.add('hidden');
    });
    
    // 复制共享链接
    elements.copyLinkBtn.addEventListener('click', () => {
        elements.shareLinkInput.select();
        document.execCommand('copy');
        
        // 显示复制成功提示
        const originalText = elements.copyLinkBtn.textContent;
        elements.copyLinkBtn.textContent = '已复制!';
        elements.copyLinkBtn.classList.add('bg-green-600');
        
        setTimeout(() => {
            elements.copyLinkBtn.textContent = originalText;
            elements.copyLinkBtn.classList.remove('bg-green-600');
        }, 2000);
    });
    
    // 关闭添加模态框
    elements.closeAddModal.addEventListener('click', () => {
        elements.addModal.classList.add('hidden');
    });
    
    // 提交添加表单
    elements.addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newOption = {
            name: document.getElementById('name').value,
            type: document.getElementById('type').value,
            distance: document.getElementById('distance').value,
            isFavorite: document.getElementById('isFavorite').checked
        };
        
        LunchOptions.add(newOption);
        elements.addModal.classList.add('hidden');
        renderOptions();
        
        // 显示成功提示
        const header = document.querySelector('header');
        header.classList.add('bg-green-100');
        setTimeout(() => {
            header.classList.remove('bg-green-100');
        }, 2000);
    });
    
    // 信息按钮
    elements.infoBtn.addEventListener('click', () => {
        elements.infoModal.classList.remove('hidden');
    });
    
    // 关闭信息模态框
    elements.closeInfoBtn.addEventListener('click', () => {
        elements.infoModal.classList.add('hidden');
    });
    
    elements.gotItBtn.addEventListener('click', () => {
        elements.infoModal.classList.add('hidden');
    });
    
    // 点击模态框外部关闭
    elements.addModal.addEventListener('click', (e) => {
        if (e.target === elements.addModal) {
            elements.addModal.classList.add('hidden');
        }
    });
    
    elements.shareModal.addEventListener('click', (e) => {
        if (e.target === elements.shareModal) {
            elements.shareModal.classList.add('hidden');
        }
    });
    
    elements.infoModal.addEventListener('click', (e) => {
        if (e.target === elements.infoModal) {
            elements.infoModal.classList.add('hidden');
        }
    });
}

// 初始化
function init() {
    // 暴露给全局以便在HTML中使用
    window.LunchOptions = LunchOptions;
    window.renderOptions = renderOptions;
    
    setupEventListeners();
    renderOptions();
    
    // 检查是否有共享数据需要导入
    ShareManager.checkAndImportSharedData();
    
    // 首次使用显示帮助
    const hasVisited = localStorage.getItem('lunchChooserVisited');
    if (!hasVisited) {
        elements.infoModal.classList.remove('hidden');
        localStorage.setItem('lunchChooserVisited', 'true');
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);
