let prevDir = "";
let dir = "";
document.body.addEventListener("keydown", (e) => {
    switch (e.code) {
        case "ArrowRight":
            if (prevDir !== "ArrowLeft") {
                dir = e.code;
            }
            break;
        case "ArrowLeft":
            if (prevDir !== "ArrowRight") {
                dir = e.code;
            }
            break;
        case "ArrowUp":
            if (prevDir !== "ArrowDown") {
                dir = e.code;
            }
            break;
        case "ArrowDown":
            if (prevDir !== "ArrowUp") {
                dir = e.code;
            }
            break;
        case "Space":
            dir = dir === e.code ? prevDir : e.code;
            break;
        case "Escape":
            if (dir) {
                dir = "Space"
            }
            document.querySelector(".settings").classList.toggle("show");
            break;
        case "Enter":
            if (document.querySelector(".settings").classList.contains("show")) {
                start();
            }
            break;
        default:
            break;
    }
    if (prevDir !== dir && dir !== "Space") {
        prevDir = dir;
    }
});
document.querySelector(".start").addEventListener("click", () => {
    start();
});

const start = () => {
    document.querySelector(".container").innerHTML = "<div class=\"wrapper\"></div>";
    const size = +document.getElementById("size").value;
    const total = +document.getElementById("total").value;
    const speed = +document.getElementById("speed").value;
    const img = document.getElementById("img").value;
    const level = makeLevel(size > 50 ? 50 : size, speed, total);
    const image = new Image();
    image.src = img;
    const wrapper = document.querySelector(".wrapper");
    wrapper.classList.add("overlay", "loading");
    image.onload = () => {
        init(level, image);
        wrapper.classList.remove("overlay", "loading");
    }
    image.onerror = () => {
        init(level);
        wrapper.classList.remove("overlay", "loading");
    }
    document.querySelector(".settings").classList.remove("show");
    dir = "";
}

let interval;
const init = (config, img) => {
    clearInterval(interval);
    const wrapper = document.querySelector(".wrapper");
    wrapper.innerHTML = "<canvas></canvas>";
    const canvas = document.querySelector("canvas");
    const { width, height } = wrapper.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const tdSize = width / config.items[0].length;
    paintMap(ctx, config, tdSize, img);
    const speed = Math.round(1000 / config.speed);
    interval = setInterval(() => {
        if (dir) {
            /** pause */
            if (dir === "Space") {
                wrapper.classList.add("overlay", "pause");
                return;
            }
            wrapper.classList.remove("overlay", "pause");
            const status = moveSnake(config, dir);
            switch (status) {
                case "end":
                    wrapper.classList.add("overlay", "endLevel");
                    clearInterval(interval);
                    break;
                case "crash":
                    wrapper.classList.add("overlay", "die");
                    clearInterval(interval);
                    break;
                default:
                    ctx.clearRect(0, 0, width, height);
                    paintMap(ctx, config, tdSize, img);
                    break;
            }
        }
    }, speed < 50 ? 50 : speed);
    return interval;
};

const moveSnake = (config, direction) => {
    const items = config.items;
    const { tailX, tailY, headX, headY } = getSnakePosition(items);
    const clearTail = () => {
        items[tailY][tailX] = 0;
    };
    const moveHead = (y, x) => {
        items[y][x] = items[headY][headX] + 1;
    };
    const generateEatItem = () => {
        config.generateEatItem(config);
    };
    const getState = (state) => {
        if (config.count < config.total) {
            return state;
        }
        return -1;
    };
    const move = {
        ArrowRight: () => {
            const [y, x] = [headY, headX + 1];
            const nextState = getState(items[y]?.[x]);
            const action = getAction(nextState);
            const actions = {
                move: () => {
                    moveHead(y, x);
                    clearTail();
                },
                eat: () => {
                    moveHead(y, x);
                    generateEatItem();
                },
                crash: () => { },
                end: () => { },
            };
            actions[action]();
            return action;
        },
        ArrowUp: () => {
            const [y, x] = [headY - 1, headX];
            const nextState = getState(items[y]?.[x]);
            const action = getAction(nextState);
            const actions = {
                move: () => {
                    moveHead(y, x);
                    clearTail();
                },
                eat: () => {
                    moveHead(y, x);
                    generateEatItem();
                },
                crash: () => { },
                end: () => { },
            };
            actions[action]();
            return action;
        },
        ArrowLeft: () => {
            const [y, x] = [headY, headX - 1];
            const nextState = getState(items[y]?.[x]);
            const action = getAction(nextState);
            const actions = {
                move: () => {
                    moveHead(y, x);
                    clearTail();
                },
                eat: () => {
                    moveHead(y, x);
                    generateEatItem();
                },
                crash: () => { },
                end: () => { },
            };
            actions[action]();
            return action;
        },
        ArrowDown: () => {
            const [y, x] = [headY + 1, headX];
            const nextState = getState(items[y]?.[x]);
            const action = getAction(nextState);
            const actions = {
                move: () => {
                    moveHead(y, x);
                    clearTail();
                },
                eat: () => {
                    moveHead(y, x);
                    generateEatItem();
                },
                crash: () => { },
                end: () => { },
            };
            actions[action]();
            return action;
        }
    };
    const status = move[direction]();
    return status;
};

const getSnakePosition = (values) => {
    let tailX, tailY, headX, headY;
    values.reduce(
        (acc, items, y) => {
            let [min, max] = acc;
            items.forEach((num, x) => {
                if (num < 2) return;
                if (num < min) {
                    min = num;
                    tailX = x;
                    tailY = y;
                }
                if (num > max) {
                    max = num;
                    headX = x;
                    headY = y;
                }
            });
            return [min, max];
        },
        [1000000, 0]
    );
    return { tailX, tailY, headX, headY };
};

const getAction = (next) => {
    switch (next) {
        case 0:
            return "move";
        case 1:
            return "eat";
        case -1:
            return "end";
        default:
            return "crash";
    }
};

const paintMap = (ctx, lvlItem, tdSize, img) => {
    const items = lvlItem.items;
    let headEl,
        max = 0,
        tailEl,
        min = 10000;
    const coords = { height: tdSize, width: tdSize, left: 0, top: 0 };
    items.forEach((array, i) => {
        array.forEach((item, j) => {
            coords.top = coords.height * i;
            coords.left = coords.width * j;
            // snake item
            if (item === 1) {
                ctx.beginPath();
                ctx.fillStyle = "#85144b";
                ctx.fillRect(coords.left, coords.top, coords.width, coords.height);
                ctx.strokeStyle = "white";
                ctx.strokeRect(coords.left, coords.top, coords.width, coords.height);
                ctx.closePath();
            }
            // snake
            if (item > 1) {
                ctx.beginPath();
                ctx.fillStyle = "#252f50";
                ctx.fillRect(coords.left, coords.top, coords.width, coords.height);
                ctx.strokeStyle = "white";
                ctx.strokeRect(coords.left, coords.top, coords.width, coords.height);
                ctx.closePath();
            }
            if (item > max) {
                max = item;
                headEl = Object.assign({}, coords);
            }
            if (min > item && item > 1) {
                min = item;
                tailEl = Object.assign({}, coords);
            }
        });
    });
    ctx.beginPath();
    if (img) {
        img.width = headEl.width
        img.height = headEl.height
        ctx.drawImage(img, headEl.left, headEl.top, headEl.width, headEl.height);
    } else {
        ctx.fillStyle = "orange";
        ctx.fillRect(
            headEl.left,
            headEl.top,
            headEl.width,
            headEl.height
        );
    }
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(
        tailEl.left,
        tailEl.top,
        tailEl.width,
        tailEl.height
    );
    ctx.closePath();
};

const makeLevel = (size, speed, total) => {
    /**
    * 1 = snake item
     * >= 2 snake
    */
    const generateLevel = (size = 10) => {
        const items = [];
        let i = size + 1;
        while (i) {
            const arr = [];
            arr.length = size + 1;
            arr.fill(0);
            items.push(arr);
            i--;
        }
        items[0][0] = 2;
        items[0][1] = 3;
        return items;
    };
    const countEl = document.querySelector(".count");
    const generateEatItem = (level, skip) => {
        if (level.count > level.total) {
            return;
        }
        const random = () => Math.round(Math.random() * level.items[0].length);
        while (true) {
            const y = random();
            const x = random();
            if (level.items[y]?.[x] === 0) {
                level.items[y][x] = 1;
                break;
            }
        }
        if (!skip) {
            level.count++;
        }
        countEl.innerText = level.count;
    };
    const level = {
        items: generateLevel(size),
        speed,
        count: 0,
        total,
        generateEatItem,
    };
    generateEatItem(level, true);
    document.querySelector(".total").innerText = level.total;
    return level;
}
