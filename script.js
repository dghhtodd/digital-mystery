document.addEventListener('DOMContentLoaded', () => {
    const MAX_ATTEMPTS = 6;
    let currentAttempt = 0;
    let secretCode = generateSecretCode();
    
    // 初始化输入区域
    const guessArea = document.getElementById('guessArea');
    initializeGame();

    function generateSecretCode() {
        const digits = new Set();
        while (digits.size < 6) {
            digits.add(Math.floor(Math.random() * 10));
        }
        return Array.from(digits).join('');
    }

    function initializeGame() {
        guessArea.innerHTML = '';
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            const row = document.createElement('div');
            row.className = 'guess-row';
            if (i === 0) row.classList.add('active-row'); // 确保首行激活
            for (let j = 0; j < 6; j++) {
                const cell = document.createElement('input');
                cell.className = 'guess-cell';
                cell.type = 'text';
                cell.maxLength = 1;
                cell.readOnly = true;
                cell.value = ''; // 清空原有值
                cell.classList.remove('correct', 'exist', 'wrong', 'submitted');
                row.appendChild(cell);
            }
            guessArea.appendChild(row);
        }
    }

    function setActiveRow(index) {
        document.querySelectorAll('.guess-row').forEach((row, i) => {
            row.classList.toggle('active-row', i === index);
        });
    }

    // 提交验证逻辑
    window.submitGuess = function() {
        const activeRow = document.querySelector('.active-row');
        if (activeRow.classList.contains('submitted')) return; // 防止重复提交
        
        const inputs = Array.from(activeRow.querySelectorAll('.guess-cell'));
        const guess = inputs.map(cell => cell.value).join('');

        if (new Set(guess).size !== 6) {
            alert('請輸入6位不重複數字！');
            return;
        }

        activeRow.classList.add('submitted'); // 标记已提交行
        // 验证逻辑
        inputs.forEach((cell, i) => {
            const num = cell.value;
            if (num === secretCode[i]) {
                cell.classList.add('correct');
            } else if (secretCode.includes(num)) {
                cell.classList.add('exist');
            } else {
                cell.classList.add('wrong');
            }
        });

        if (guess === secretCode) {
            setTimeout(() => {
                alert('恭喜破譯成功！');
                resetGame();
            }, 300);
            return;
        }

        currentAttempt++;
        if (currentAttempt >= MAX_ATTEMPTS) {
            setTimeout(() => {
                alert(`遊戲結束！正確密碼是：${secretCode}`);
                resetGame();
            }, 300);
            return;
        }

        setActiveRow(currentAttempt);
    };

    // 逐个删除
    window.clearOne = function() {
        const activeRow = document.querySelector('.active-row');
        if (!activeRow || activeRow.classList.contains('submitted')) return;
        
        const cells = Array.from(activeRow.querySelectorAll('.guess-cell'));
        // 从右往左找第一个有值的单元格
        for (let i = cells.length - 1; i >= 0; i--) {
            if (cells[i].value) {
                cells[i].value = '';
                cells[i].classList.remove('correct', 'exist', 'wrong');
                break;
            }
        }
    };

    // 清除整行
    window.clearAll = function() {
        const activeRow = document.querySelector('.active-row');
        if (!activeRow || activeRow.classList.contains('submitted')) return;
        
        activeRow.querySelectorAll('.guess-cell').forEach(cell => {
            cell.value = '';
            cell.classList.remove('correct', 'exist', 'wrong');
        });
    };

    // 添加数字输入函数
    window.inputNum = function(n) {
        const activeRow = document.querySelector('.active-row');
        if (!activeRow) return; // 防止无活动行时操作
        
        const cells = activeRow.querySelectorAll('.guess-cell');
        for (let cell of cells) {
            // 精确判断空值且未被锁定（已提交的行不可编辑）
            if (cell.value === '' && !cell.classList.contains('correct')) {
                cell.value = n;
                break;
            }
        }
    };

    // 重置游戏
    function resetGame() {
        if(confirm('確定要開始新遊戲嗎？當前進度將會丟失！')) {
            secretCode = generateSecretCode();
            currentAttempt = 0;
            initializeGame();
            localStorage.removeItem('gameState');
        }
    }

    // 修改为公开函数
    window.resetGame = resetGame;

    // 强制竖屏锁定
    screen.orientation.lock('portrait').catch(() => {});
    window.addEventListener('orientationchange', () => {
        location.reload();
    });

    // 保存游戏进度
    function saveProgress() {
        const state = {
            currentAttempt,
            guesses: Array.from(document.querySelectorAll('.guess-row')).map(row => 
                Array.from(row.querySelectorAll('.guess-cell')).map(cell => ({
                    value: cell.value,
                    status: cell.className.replace('guess-cell ', '')
                }))
            )
        };
        localStorage.setItem('gameState', JSON.stringify(state));
    }

    // 加载进度
    function loadProgress() {
        const saved = localStorage.getItem('gameState');
        if (saved) {
            const state = JSON.parse(saved);
            currentAttempt = state.currentAttempt;
            state.guesses.forEach((row, i) => {
                const cells = document.querySelectorAll(`.guess-row:nth-child(${i+1}) .guess-cell`);
                row.forEach((cellData, j) => {
                    cells[j].value = cellData.value;
                    cells[j].className = `guess-cell ${cellData.status}`;
                });
            });
            setActiveRow(currentAttempt);
        }
    }

    // 在游戏初始化时调用
    loadProgress();

    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        const installBtn = document.createElement('button');
        installBtn.textContent = '安裝應用';
        installBtn.style.position = 'fixed';
        installBtn.style.bottom = '20px';
        installBtn.style.left = '50%';
        installBtn.style.transform = 'translateX(-50%)';
        installBtn.onclick = () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
            });
        };
        document.body.appendChild(installBtn);
    });

    function adjustButtonSize() {
        const buttons = document.querySelectorAll('.num-btn');
        const containerWidth = document.querySelector('.keypad').offsetWidth;
        const btnSize = (containerWidth * 0.9) / 4 - 6; // 4列布局
        buttons.forEach(btn => {
            btn.style.width = `${btnSize}px`;
            btn.style.height = `${btnSize}px`;
        });
    }

    window.addEventListener('resize', adjustButtonSize);
    adjustButtonSize();
}); 