"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;

const { ipcMain, BrowserWindow } = require('electron');

// 点击一键发布时，获取发布面板的id，通过这个id来启用一键发布按钮
let id = "";

// 需要用的一些库
const fs = require('fs');
const exec = require('child_process').exec;
const path = require('path');
let previewPort = "";
let electronVersion = "";


// 是否开始构建
let isStartBuild = false;
// 打包log
let buildLog = "还没有开始构建，点击“一键发布”按钮开始构建才会有log";




// 注释掉所有log
console.log = function() {}






/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {

    // 一键测试配置系统默认值
    check() {
        checkData();
    },

    // 打开关于作者面板
    author () {
        console.log("关于作者");
        Editor.Panel.open("build_windows_app.author");
    },

    // 打开发布面板
    openBuildPanel() {
        // 如果没开始构建
        if (isStartBuild == false) {
            console.log("打开了发布面板");

            // 缺少代码，应该是当面板的版本号  ==   ""  时再去获取electron版本号

            // 获取版本号相关代码
            getData("b.v")[2].then((result) => {
                if (result == "") {
                    console.log("electron版本号为空，可能是第一次运行，需要获取");

                    // 指令
                    const cmd = "electron -v";
                    exec(cmd, function (error, stdout, stderr) {
                        if (error) {
                            console.log("获取electron版本号错误", error);

                            // 失败构建弹窗
                            const config = {
                                title: "很抱歉，获取electron版本号失败了",
                                detail: '很抱歉，获取electron版本号失败了',
                            };
                            Editor.Dialog["error"]("很抱歉，获取electron版本号失败了，请手动输入electron版本号", config);

                            ipcMain.on('getEV', (event) => {
                                console.log("66666666666666666666666666666")
                                event.returnValue = "请手动输入electron版本号";
                            })

        
                            Editor.Panel.open("build_windows_app.build");
                        } else {
                            let v = stdout;

                            //去掉空格
                            v = v.replace(/\ +/g,"");   
                            //去掉回车换行        
                            v = v.replace(/[\r\n]/g,"");

                            electronVersion = v;

                            // console.log("获取版本号成功了", v);
                            
                        
                            // 成功构建弹窗
                            const config = {
                                title: "恭喜！成功获取版本号",
                                detail: '恭喜！成功获取版本号',
                                buttons: ["我知道了"],
                            };
                            Editor.Dialog.info("恭喜！成功获取版本号:" + v, config);

                            ipcMain.on('getEV', (event) => {
                                console.log("66666666666666666666666666666")
                                event.returnValue = electronVersion;
                            })

                            Editor.Panel.open("build_windows_app.build");
                        }
                        
                    });
                } else {
                    console.log("electron有版本号，不需要获取，不是第一次使用插件");
                    Editor.Panel.open("build_windows_app.build");
                }
            });
        } else {
            console.log("正在构建中，在构建结束前无法再打开面板");
            // 失败构建弹窗
            const config = {
                title: "正在构建中，在构建结束前无法再打开面板",
                detail: '正在构建中，在构建结束前无法再打开面板',
            };
            Editor.Dialog["error"]("正在构建中，在构建结束前无法再打开面板", config);
        }

    },

    // 打开预览设置面板
    openPreviewSetPanel () {
        console.log("打开了预览设置面板");
        Editor.Panel.open("build_windows_app.preview");
    },


    // 开始构建
    startBuild(value) {
        // 当前窗口的ID，目的是向渲染进程发送消息
        id = BrowserWindow.getFocusedWindow().id;
        console.log("获取到的窗口的ID", id);

        isStartBuild = true;



        // 在构建面板关闭时
        let win = BrowserWindow.getFocusedWindow().on('close', e => {
            // 如果构建开始了
            if (isStartBuild == true) {
                console.log("成功接到了回调，阻止了面板关闭");
                // 阻止面板关闭
                e.preventDefault();

                const config = {
                    title: '标题',
                    detail: '您真的关掉发布面板吗，在构建完成前不可以再打开面板',
                    buttons: ["取消", "确定"],
                };
                const code = Editor.Dialog.info('您真的关掉发布面板吗', config);
                code.then((result) => {
                    let re = result.response;
                    // 选择了确定
                    if (re == 1) {
                        win.destroy();
                    }
                });
            }
        });


        

        buildLog = "正在构建中，log马上就来"

        let a = path.resolve(__dirname, '..');
        let b = path.resolve(a, '..');
        // 项目路径
        let c = path.resolve(b, '..');


        // 输出log
        console.log("开始构建");

        /* console.log("构建参数", value[0]);
        console.log("构建参数", value[1]);
        console.log("构建参数", value[2]); */


        // 因为\不能在代码中使用，所以替换成/，build_lj就是最终输出路径
        let build_lj_ = value[2].split("\\");
        let build_lj = "";
        for (let i = 0; i < build_lj_.length; i ++) { 
            build_lj += build_lj_[i] + "/";
        }


        // 图标路径最后有一个/，会导致构建失败，在路径的字符串上做些处理
        let icon = value[7].substring(0, value[7].length - 1);
        console.log("原来图标路径", value[7], "处理后的", icon);


        // 架构
        let jg = "";
        if (value[8] == 1) {
            jg = "ia32";
        } 
        if (value[8] == 2) {
            jg = "x64";
        } 
        if (value[8] == 3) {
            jg = "armv7l";
        }
        if (value[8] == 4) {
            jg = "arm64";
        }
        if (value[8] == 5) {
            jg = "mips64el";
        }


        /* if (electronVersion == "") {
            console.log("没获取到EV");
            electronVersion = value[9];
        } */

        // 修改JSON
        let webPath = value[1] + "/index.html";
        let webText = fs.readFileSync(webPath, "utf8");
        let add = `
        \n
<script>
    window.electron = require('electron');
</script>
        `;
        // 没出现，也就是html结尾没有<script>标签
        if (webText.indexOf(add) == -1) {
            console.log("没出现");
            fs.writeFileSync(webPath, webText + add);
        } else {
            console.log("出现了");
        }

        console.log("目标web路径", webPath);
        // fs.writeFileSync(webPath, webText + add);
        console.log('写入操作完成');



        /* console.log("被复制：", value[1], "复制到", a+ "/main/build/web");
        //fs.cp(value[1], a + "/main/build/web");
        CopyDirectory(value[1], a + "/main/build/web") */
        // clearDir(a + "/main/build/web")
        //fs.mkdir(a + "/main/build/web");
        // copyFolder(value[1], a + "/main/build/web");
    

        /* const config = {
            title: "警告",
            detail: `插件检测到当前已经有预览模板，请使用preview-template/index.ejs\n下的预览模板\n\n否则插件提供的API将无法调用`,
        };
        Editor.Dialog["warn"]("检测到当前已经有预览模板", config); */



        // 打包指令
        let build_cmd = `electron-packager . ${value[0]} --platform=win32 --out=${build_lj} --arch=${jg} --app-version=${value[6]} --electronVersion=${value[9]} --icon=${icon}`
        if (value[3] == true) {
            build_cmd += " --asar";
        }

        if (value[4] == false) {
            build_cmd += " --ignore=node_modules";
        }

        if (value[5] == true) {
            build_cmd += " --overwrite";
        }


        console.log("输出路径", build_lj);
        console.log("打包指令：", build_cmd);


        // 重新写入JSON
        var jc = `
        {
            "name": "win",
            "version": "0.1.0",
            "main": "build.js",
            "description": "没有描述",
            "author": "property",
        
            "scripts": {
                "package-win": "${build_cmd}"
            }
            
        }
        `;

        // 修改JSON
        let filepath = a + "/main/build/package.json";
        fs.writeFileSync(filepath, jc);
        console.log('写入操作完成');


        // 指令
        const cmd = "npm run package-win";
        // 创建cmd的位置
        const cwd = `${a}/main/build`;
        // const windowsHide = false
        exec(cmd, { cwd }, function (error, stdout, stderr) {
            if (error) {
                console.log("构建失败");

                // 失败构建弹窗
                const config = {
                    title: "很抱歉，打包失败了",
                    detail: '打包失败，请查看log',
                };
                Editor.Dialog["error"]("很抱歉，打包失败了", config);


                buildLog = "error" + error;
                buildLog += stdout + "\n";
                buildLog += stderr;

                isStartBuild = false;


                // 启用一键发布按钮
                if (BrowserWindow.fromId(id) == null) {
                    console.log("面板被关掉了，不能通过id获取到，无法启用一键发布按钮");
                } else {
                    BrowserWindow.fromId(id).webContents.send("enableBtn");
                    console.log("面板没被关掉，顺利启用一键发布按钮");
                }

                return;
            }


            // 复制一份nircmd到输出路径
            fs.copyFileSync(__dirname + "\\nircmd.exe", `${build_lj}${value[0]}-win32-${jg}\\nircmd.exe`);


            buildLog = stdout + "\n";
            buildLog += stderr;
            console.log("标准输出1", stdout);
            console.log("标准输出2", stderr);

            console.log("构建成功了！");
            isStartBuild = false;


            // 成功构建弹窗
            const config = {
                title: "恭喜！构建成功！",
                detail: '已经成功发布',
            };
            Editor.Dialog["info"]("恭喜！构建成功！", config);


            // 启用一键发布按钮
            if (BrowserWindow.fromId(id) == null) {
                console.log("面板被关掉了，不能通过id获取到，无法启用一键发布按钮");
            } else {
                BrowserWindow.fromId(id).webContents.send("enableBtn");
                console.log("面板没被关掉，顺利启用一键发布按钮");
            }


        });
        return(build_cmd);

    },


    // 预览
    preview() {
        // 是否检测好预览模板使用情况
        let isCheckOK = false;

        let a = path.resolve(__dirname, '..');
        let b = path.resolve(a, '..');
        // bb
        let c = path.resolve(b, "..");

        // 因为\不能在代码中使用，所以替换成/
        let aa = c.split("\\");
        let bb = "";
        for (let i = 0; i < aa.length; i ++) { 
            bb += aa[i] + "/";
        }

        // 原来模板
        let d = bb + "preview-template/index.ejs";

        // 因为\不能在代码中使用，所以替换成/
        let aaa = path.resolve(__dirname, '..')
        let bbb = aaa.split("\\");
        let ccc = "";
        for (let i = 0; i < bbb.length; i ++) { 
            ccc += bbb[i] + "/";
        }


        // 目标模板
        let e = ccc + "main/preview/preview-template/index.ejs";
        // 模板文件夹
        let f = bb + "preview-template";

        console.log("原来模板,", d, "目标模板",e);


        // 如果原来没有模板
        fs.access(d, (err) => {
            if (err) {
                console.log("没有原来模板");


                fs.access(bb + "preview-template", (err) => {
                    // 如果没有preview-template文件夹
                    if (err) {
                        // 创建preview-template文件夹
                        fs.mkdirSync(
                            bb + "preview-template",
                            function (err, data) {
                            console.log("路径", c, "创建文件夹", err, data);
                            }
                        );
                        // 复制文件
                        fs.copyFileSync(e, bb + "preview-template/index.ejs");

                        // 弹窗
                        const config = {
                            title: "build_windows_app | 一键发布Windows插件  ",
                            detail: `为了调用插件提供的API，已经使用了预览模板，位置如下\n${bb}preview-template/index.ejs`,
                        };
                        Editor.Dialog["info"]("已经使用了插件提供的预览模板", config);

                        console.log("新建文件夹准备复制目标模板");

                        // 打开预览窗口
                        openPreview();
                    }
                    // 如果有preview-template文件夹 
                    else {
                        fs.copyFileSync(e, bb + "preview-template/index.ejs");

                        // 弹窗
                        const config = {
                            title: "build_windows_app | 一键发布Windows插件  ",
                            detail: `为了调用插件提供的API，已经使用了预览模板，位置如下\n${bb}preview-template/index.ejs`,
                        };
                        Editor.Dialog["info"]("已经使用了插件提供的预览模板", config);

                        console.log("发现preview-template文件夹，已经复制模板");

                        // 打开预览窗口
                        openPreview();
                    }
                });

            // 原来没有模板，也就是检测顺利
            isCheckOK = true;
        
            // 如果原来有模板
            } else {
                console.log("有原来模板");
                let index = fs.readFileSync(d, "utf8");
                // 目标模板
                let index_ = fs.readFileSync(e, "utf8");

                console.log("原来", index, "目标", index_);

                // 原有的预览模板和目标模板是一样的
                if (index == index_) {
                    console.log("经过检查，原有的预览模板和目标模板是一样的");
                    // 模板一样，也就是检测顺利
                    isCheckOK = true;

                    // 打开预览窗口
                    openPreview();
                }
                // 不一样
                else {
                    // 失败构建弹窗
                    const config = {
                        title: "警告",
                        detail: `插件检测到当前已经有预览模板，请使用\n${bb}preview-template/index.ejs\n下的预览模板\n\n否则插件提供的API将无法调用`,
                    };
                    Editor.Dialog["warn"]("检测到当前已经有预览模板", config);
                    /* console.log("经过检查，两个模板不一样，马上进行复制操作替换原模板");
                    // 把原来的模板重命名
                    fs.renameSync(f, bb + "原来的预览模板");
                    fs.copyFileSync(e, bb + "/preview-template/index.ejs"); */

                }

            }
        });
        

    },


    // 设置预览端口
    setPreviewPort (port) {
        previewPort = port;
        console.log("port:", port);
    },


    setLog () {
        return buildLog;
    },

    setBuildCmd () {
        return
    },


    demo () {
        console.log("demo");
        // window.open("https://wwc.lanzouj.com/inuf308mx0rg");
        exec('start https://wwc.lanzouj.com/iYtnA091mb2b');
    },


    api () {
        let a = path.resolve(__dirname, '..');
        let b = path.resolve(a, '..');
        // bb
        let c = path.resolve(b, "..");

        // 因为\不能在代码中使用，所以替换成/
        let aa = c.split("\\");
        let bb = "";
        for (let i = 0; i < aa.length; i ++) { 
            bb += aa[i] + "/";
        }

        let ccc = a.split("\\");
        let cc = "";
        for (let i = 0; i < ccc.length; i ++) { 
            cc += ccc[i] + "/";
        }

        // 复制文件
        fs.copyFileSync(cc + "main/ElectronAPI.ts", bb + "assets/ElectronAPI.ts");
   
        // 构建弹窗
        const config = {
            title: "弹窗",
            detail: `API提示已经复制到项目的asset目录下\n${bb}assets/ElectronAPI.ts\n`,
            buttons: ["我知道了"],
        };
        Editor.Dialog.info("API已准备就绪", config).then(result => {
            exec(`start ${bb}assets`);

            console.log("点击了我知道了");
        });

        console.log("api");
    },

};












// 打开预览窗口
function openPreview () {
    // 首次预览需要设置预览端口
    if (previewPort == "") {
        // 失败构建弹窗
        const config = {
            title: "错误",
            detail: `请在最上面的菜单栏\n发布win插件--->预览设置\n中设置预览端口`,
        };
        Editor.Dialog["error"]("请设置预览端口", config);
        return;
    }

    console.log("开始预览");

    let aaaa = path.resolve(__dirname, '..');

    let filepath = aaaa + "/main/preview/port.txt";
    fs.writeFileSync(filepath, previewPort);
    console.log('写入操作完成', "端口：", previewPort);

    let aaaaa = path.resolve(__dirname, '..');
    // 指令
    const cmd = 'electron preview';
    // 创建cmd的位置
    const cwd = `${aaaaa}/main/preview`;
    exec(cmd, { cwd }, function (error, stdout, stderr) {
        if (error) {
            console.log("预览失败", error);
            return;
        }
        console.log("输出内容1:", stderr);
        console.log("输出内容2：", stdout);
        console.log("预览成功了！");
    }); 
}

// 检测预览模板
function check () {
    let a = path.resolve(__dirname, '..');
        let b = path.resolve(a, '..');
        // bb
        let c = path.resolve(b, "..");

        // 因为\不能在代码中使用，所以替换成/
        let aa = c.split("\\");
        let bb = "";
        for (let i = 0; i < aa.length; i ++) { 
            bb += aa[i] + "/";
        }

        // 原来模板
        let d = bb + "preview-template/index.ejs";

        // 因为\不能在代码中使用，所以替换成/
        let aaa = path.resolve(__dirname, '..')
        let bbb = aaa.split("\\");
        let ccc = "";
        for (let i = 0; i < bbb.length; i ++) { 
            ccc += bbb[i] + "/";
        }


        // 目标模板
        let e = ccc + "main/preview/preview-template/index.ejs";
        // 模板文件夹
        let f = bb + "preview-template";

        console.log("原来模板,", d, "目标模板",e);


        // 如果原来没有模板
        fs.access(d, (err) => {
            if (err) {
                console.log("没有原来模板");


                fs.access(bb + "preview-template", (err) => {
                    // 如果没有preview-template文件夹
                    if (err) {
                        // 创建preview-template文件夹
                        fs.mkdirSync(
                            bb + "preview-template",
                            function (err, data) {
                            console.log("路径", c, "创建文件夹", err, data);
                            }
                        );
                        // 复制文件
                        fs.copyFileSync(e, bb + "preview-template/index.ejs");

                        // 弹窗
                        const config = {
                            title: "build_windows_app | 一键发布Windows插件  ",
                            detail: `为了调用插件提供的API，已经使用了预览模板，位置如下\n${bb}preview-template/index.ejs`,
                        };
                        Editor.Dialog["info"]("已经使用了插件提供的预览模板", config);

                        console.log("新建文件夹准备复制目标模板");
                    }
                    // 如果有preview-template文件夹 
                    else {
                        fs.copyFileSync(e, bb + "preview-template/index.ejs");

                        // 弹窗
                        const config = {
                            title: "build_windows_app | 一键发布Windows插件  ",
                            detail: `为了调用插件提供的API，已经使用了预览模板，位置如下\n${bb}preview-template/index.ejs`,
                        };
                        Editor.Dialog["info"]("已经使用了插件提供的预览模板", config);

                        console.log("发现preview-template文件夹，已经复制模板");
                    }
                });

        
            // 如果原来有模板
            } else {
                console.log("有原来模板");
                let index = fs.readFileSync(d, "utf8");
                // 目标模板
                let index_ = fs.readFileSync(e, "utf8");

                console.log("原来", index, "目标", index_);

                // 原有的预览模板和目标模板是一样的
                if (index == index_) {
                    console.log("经过检查，原有的预览模板和目标模板是一样的");
                }
                // 不一样
                else {
                    // 失败构建弹窗
                    const config = {
                        title: "警告",
                        detail: `插件检测到当前已经有预览模板，请使用\n${bb}preview-template/index.ejs\n下的预览模板\n\n否则插件提供的API将无法调用`,
                    };
                    Editor.Dialog["warn"]("检测到当前已经有预览模板", config);
                    /* console.log("经过检查，两个模板不一样，马上进行复制操作替换原模板");
                    // 把原来的模板重命名
                    fs.renameSync(f, bb + "原来的预览模板");
                    fs.copyFileSync(e, bb + "/preview-template/index.ejs"); */
                }

            }
        });
}

/**
 * 获取配置系统的数据
 * @param {*} key 
 * @return 返回一个数组，0是default，1是project，2是没有指定
 */
 function getData (key) {
    let a = Editor.Profile.getProject("build_windows_app", key, "default");
    let b = Editor.Profile.getProject("build_windows_app", key, "project");
    let c = Editor.Profile.getProject("build_windows_app", key);
    return ([a, b, c]);
}

/**
 * 设置配置系统的数据
 * @param {*} key 
 * @param {*} value 
 */
 function setData (key, value, type) {
    Editor.Profile.setProject("build_windows_app", key, value, type);
    console.log("设置了配置数据");
}

// 设置配置系统的默认数据
function setDataDefault (key, value) {
    setData(key, value, "default");
}

// 一键测试配置系统默认值
function checkData () {
    // 设置配置系统的默认值
    let a = getData("b.name")[0].then((result) => {
        //console.log("解析的结果", result);
    });
    let b = getData("b.v")[0].then((result) => {
        //console.log("解析的结果", result);
    });
    /* let c = getData("b.webLJ")[0].then((result) => {
        //console.log("解析的结果", result);
    }); */
    let d = getData("b.shuchuLJ")[0].then((result) => {
        //console.log("解析的结果", result);
    });
    let e = getData("b.asar")[0].then((result) => {
        //console.log("解析的结果", result);
    });
    let f = getData("b.isNode")[0].then((result) => {
        //console.log("解析的结果", result);
    });
    let g = getData("b.isCover")[0].then((result) => {
        //console.log("解析的结果", result);
    });
    let h = getData("b.appVersion")[0].then((result) => {
        //console.log("解析的结果", result);
    });
    let i = getData("b.icon")[0].then((result) => {
        //console.log("解析的结果", result);
    });
    let j = getData("b.jg")[0].then((result) => {
        //console.log("解析的结果", result);
    });
    console.log("一键测试配置系统默认值", a, b ,c, d, e, f ,g , h, i, j);
}

// 复制文件夹
var copyFolder = (srcDir, tarDir, cb) => {
    // 路径是否存在
    var isExit = fs.existsSync(tarDir);
    // 如果不存在
    if (!isExit) {
        // 创建文件夹
        fs.mkdirSync(tarDir);
    }
    // 这个文件夹下都有哪些文件和文件夹
    fs.readdir(srcDir, function(err, files) {
        if (err) {
            return;
        }
        files.forEach((file) => {
            var srcPath = path.join(srcDir, file);
            var tarPath = path.join(tarDir, file);
            fs.stat(srcPath, (err, stats) => {
                // 如果是文件夹
                if (stats.isDirectory()) {
                    // 如果目标路径存在
                    if (fs.existsSync(tarPath)) {
                        copyFolder(srcPath, tarPath)
                    } else {
                        fs.mkdirSync(tarPath);
                        copyFolder(srcPath, tarPath);
                    }
                }
                // 如果是文件 
                else {
                    // copyFile(srcPath, tarPath);
                    fs.copyFileSync(srcPath, tarPath);
                }
            });
      });
  
      //为空时直接回调
      files.length === 0 && cb && cb();
    });
};













/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() {
    let a = path.resolve(__dirname, '..');
    let b = path.resolve(a, '..');
    let c = path.resolve(b, '..');

    // 设置配置系统的默认值
    setDataDefault("b.name", "Game");
    setDataDefault("b.v", "");
/*     setDataDefault("b.webLJ", `${c}/build/web-mobile`);
 */    setDataDefault("b.shuchuLJ", `${c}/build`);
    setDataDefault("b.asar", true);
    setDataDefault("b.isNode", true);
    setDataDefault("b.isCover", true);
    setDataDefault("b.appVersion", "1.0.0");
    setDataDefault("b.icon", `${a}/icon/icon.ico`);
    setDataDefault("b.jg", 2);

    console.log("已经设置好了配置系统的默认值");


    // 检查之前是否设置过预览端口
    Editor.Profile.getProject("build_windows_app", "port", "project").then((result) => {
        console.log("配置系统的port", result);
        if (result != undefined) {
            previewPort = result;
            console.log("之前设置过端口");
        } else {
            console.log("之前从来没设置过端口");
        }
    });
}
exports.load = load;