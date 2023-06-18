const { app, BrowserWindow, ipcMain, clipboard, screen } = require('electron');

// 获取分辨率的脚本
const resolution = require("./node-win-screen-resolution-master/lib/index.cjs");

// 子进程模块，用来执行nircmd指令
const { exec } = require('child_process');
const fs = require("fs");

// 声明窗口的变量
let win;

// 默认分辨率，就是打开游戏时的分辨率
let defaultSizeX = "1920";
let defaultSizeY = "1080";

// 当app完成初始化时，创建一个窗口
app.on('ready', createWindow);

// 在最后一个窗口被关闭时退出应用
app.on('window-all-closed', () => {
    app.quit();
});

// 创建一个窗口
function createWindow () {

    // 创建一个宽800，高600的窗口
    win = new BrowserWindow({
        // width 和 height 将设置为 web 页面的尺寸(译注: 不包含边框), 这意味着窗口的实际尺寸将包括窗口边框的大小，稍微会大一点。 默认值为 false.
        useContentSize: true,

        // 窗口宽高
        width: 800,
        height: 600,

        // 最小宽度和高度
        minWidth: 800,
        minHeight: 600,

        // 标题   默认窗口标题 默认为"Electron"。 如果由loadURL()加载的HTML文件中含有标签<title>，此属性将被忽略。
        // title: "我的应用", 

        // 网页功能设置，必须写这些，如果不写Cocos就不能调用封装好的事件
        webPreferences: {
            nodeIntegration: true,   
            enableRemoteModule: true, 
            contextIsolation: false,
        }, 
    })


    let port = fs.readFileSync(__dirname + "/port.txt", "utf8");

    // 窗口中显示的网页
    // __dirname,表示main.js所在的目录路径
    win.loadURL(`http://localhost:${port}`);

    // 全屏
    // win.setFullScreen(true);

    // 最大化窗口
    win.maximize();

    // 删除窗口的菜单栏
    win.removeMenu();

    // 任务栏图标是否闪烁
    win.flashFrame(true);


    // 监听窗体关闭事件，当窗体已经关闭时，将win赋值为null，垃圾回收。
    win.on('closed', () => {
        win = null;
    })

    win.openDevTools();


    // 窗口关闭时，设置成默认的分辨率
    win.on("close", () => {
        setDefaultResolution();
    })



    //以下事件供渲染进程调用

    // 全屏
    ipcMain.on('e_fullScreen', (event) => {
        win.setFullScreen(true);
    })

    // 窗口化
    ipcMain.on('e_window', (event) => {
        win.setFullScreen(false);
    })

    // 打开开发者工具
    ipcMain.on('e_openDevTools', (event) => {
        win.openDevTools();
    })

    // 关闭开发者工具
    ipcMain.on('e_closeDevTools', (event) => {
        win.closeDevTools();
    })

    // 当前是否全屏
    ipcMain.on('e_isFullScreen', (event) => {
        event.returnValue = win.isFullScreen();
    });

    // 设置分辨率，修改的电脑的分辨率
    ipcMain.on('e_setResolution', (event, width, height) => {
        // 在当前目录下打开cmd并且输入nircmd.exe setdisplay 要设置的宽度 要设置的高度 32
        // 三个参数分别是   要设置的宽度   要设置的高度   位色-->一般写32就可以
        exec(__dirname + `/nircmd.exe setdisplay ${width} ${height} 32`);
    });

    // 设置窗口大小
    ipcMain.on('e_setSize', (event, width, height) => {
        // 缩小窗口
        win.unmaximize()
        // 设置大小
        win.setSize(Number(width), Number(height));
        // 窗口移动到中心
        win.center();
    });

    // 移动窗口到中心
    ipcMain.on('e_center', (event) => {
        win.center();
    });

    // 自定义nircmd命令
    ipcMain.on('e_nircmdUD', (event, order) => {
        // 将传入的命令执行，前面已经加了nircmd.exe
        exec(__dirname + `/nircmd.exe ${order}`, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("meicuo");
            }
        });
    });

    // 获取一些信息
    ipcMain.on('e_getMassage', (event) => {
        event.returnValue = `CPU操作位数：${process.arch}\n 当前应用程序位于：${app.getAppPath()}\n 正在使用的Chromium版本：${process.versions.chrome}\n 正在使用的V8版本：${process.versions.v8}\n 正在使用的node版本：${process.versions.node}\n 剪贴板内容${clipboard.readText()}`
    });

    // 获取屏幕当前分辨率
    const current = resolution.current();
    // 获取屏幕支持的所有分辨率
    const available = resolution.list();

    // console.log(`Current screen resolution is ${current.width}x${current.height}`);
    // console.log(`Available resolutions (${available.length}):`);
    // console.log(available);

    // 获取屏幕支持的所有分辨率，是一个object的数组，width为宽height为高
    ipcMain.on('e_getAllResolutions', (event) => {
        // 用for循环组成一个string的数组
        let str = [];
        for (let i = 0; i < available.length; i++) {
            str.push(available[i].width + "×" + available[i].height);
        }

        // console.log("all_result", str);

        // 返回一个string的数组
        event.returnValue = str;
    });

    // 获取当前的屏幕分辨率，是一个object变量，width为宽height为高
    ipcMain.on('e_getCurrentResolution', (event) => {
        let str = current.width + "×" + current.height;
        // console.log("cur_result:", current.width + "×" + current.height);

        // 返回一个string
        event.returnValue = str;
    });


    // 设置默认分辨率为当前分辨率
    defaultSizeX = current.width;
    defaultSizeY = current.height;


    // 退出游戏
    ipcMain.on('e_quit', (event) => {
        win.close();
    });


    /* 
    测试 屏幕支持的分辨率获取和当前分辨率获取
    const current = resolution.current();
    console.log(`Current screen resolution is ${current.width}x${current.height}`);

    const available = resolution.list();
    console.log(`Available resolutions (${available.length}):`);
    console.log(available);
     */
    
    
    /* 
    // 必须在打包好的HTML文件里面加上这三句，不然Cocos的代码找不到electron
    <script>
        window.electron = require('electron');
    </script>
     */
    
}

// 设置为默认分辨率，就是刚进入游戏时的分辨率
function setDefaultResolution () {
    exec(__dirname + `/nircmd.exe setdisplay ${defaultSizeX} ${defaultSizeY} 32`);
    // console.log("close window");
}