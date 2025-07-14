// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;
// 电信宽带余额小组件 - 完全仿照国网界面
// 名称: 电信宽带余额国网版
// 作者: YourName
// 版本: 6.0

if (typeof require === 'undefined') require = importModule;
const { DmYY, Runing } = require('./DmYY');

class BroadbandWidget extends DmYY {
  constructor(arg) {
    super(arg);
    this.name = '电信宽带';
    this.en = 'broadband';
    this.version = '6.0';
    this.Run();
  }

  // 初始化比例因子
  SCALE = this.getWidgetScaleFactor();

  // 添加文件管理器和缓存路径
  fm = FileManager.local();
  CACHE_FOLDER = Script.name();
  cachePath = null;

  // 获取缩放比例
  getWidgetScaleFactor() {
    const referenceScreenSize = { width: 430, height: 932, widgetSize: 170 };
    const screenData = [
      { width: 440, height: 956, widgetSize: 170 }, // 16 Pro Max
      { width: 430, height: 932, widgetSize: 170 }, // 16 Plus, 15 Plus, 15 Pro Max, 14 Pro Max
      { width: 428, height: 926, widgetSize: 170 }, // 14 Plus, 13 Pro Max, 12 Pro Max
      { width: 414, height: 896, widgetSize: 169 }, // 11 Pro Max, XS Max, 11, XR
      { width: 402, height: 874, widgetSize: 162 }, // 16 Pro
      { width: 414, height: 736, widgetSize: 159 }, // Home button Plus phones
      { width: 393, height: 852, widgetSize: 158 }, // 16, 15, 15 Pro, 14 Pro
      { width: 390, height: 844, widgetSize: 158 }, // 14, 13, 13 Pro, 12, 12 Pro
      { width: 375, height: 812, widgetSize: 155 }, // 13 mini, 12 mini / 11 Pro, XS, X
      { width: 375, height: 667, widgetSize: 148 }, // SE3, SE2, Home button Plus in Display Zoom mode
      { width: 360, height: 780, widgetSize: 155 }, // 11 and XR in Display Zoom mode
      { width: 320, height: 568, widgetSize: 141 } // SE1
    ];

    const deviceScreenWidth = Device.screenSize().width;
    const deviceScreenHeight = Device.screenSize().height;

    const matchingScreen = screenData.find(screen =>
      (screen.width === deviceScreenWidth && screen.height === deviceScreenHeight) ||
      (screen.width === deviceScreenHeight && screen.height === deviceScreenWidth)
    );

    if (!matchingScreen) {
      return 1;
    };

    const scaleFactor = (matchingScreen.widgetSize - 30) / (referenceScreenSize.widgetSize - 30);

    return Math.floor(scaleFactor * 100) / 100;
  }

  // 计算剩余使用天数
  calculateRemainingDays(balance) {
    const currentBalance = balance || parseFloat(this.settings.balance || 0);
    const packageType = this.settings.packageType || '包月';
    const packageFee = parseFloat(this.settings.packageFee || 0);
    
    if (packageFee <= 0) return 0;
    
    let dailyCost = 0;
    if (packageType === '包月') {
      dailyCost = packageFee / 30;
    } else if (packageType === '包年') {
      dailyCost = packageFee / 365;
    }
    
    return dailyCost > 0 ? Math.floor(currentBalance / dailyCost) : 0;
  }

  // 获取每月费用
  getMonthlyFee() {
    const packageType = this.settings.packageType || '包月';
    const packageFee = parseFloat(this.settings.packageFee || 0);
    
    if (packageFee <= 0) return 0;
    
    if (packageType === '包月') {
      return packageFee.toFixed(0);
    } else if (packageType === '包年') {
      return (packageFee / 12).toFixed(0);
    }
    
    return 0;
  }

  // 获取状态颜色
  getStatusColor(balance) {
    if (balance < 10) {
      return '#FF6B6B';
    } else if (balance < 30) {
      return '#FFB347';
    } else if (balance < 100) {
      return '#4CAF50';
    } else {
      return '#2196F3';
    }
  }

  // 请求地址拼接
  buildRequestUrl() {
    const baseUrl = 'https://kid.189.cn:5443/broadbandCenter/basic/billBase';
    const zgkParam = this.settings.zgk12BhG || '';
    return `${baseUrl}?zgk12BhG=${zgkParam}`;
  }

  // 获取数据
  async fetchBalanceData() {
    const url = this.buildRequestUrl();
    const cookie = this.settings.broadband_cookie || '';

    try {
      const req = new Request(url);
      req.headers = {
        'Cookie': cookie,
        'User-Agent': 'CtClient;12.3.0;iOS;18.5;iPhone XS;OTQzNTY4!#!MTU3MTI=',
        'Accept': 'application/json',
        'Referer': 'https://kid.189.cn:5443/broadband/bills/balance'
      };

      const response = await req.loadJSON();
      if (response.status === 0) {
        return response.data;
      } else {
        throw new Error(response.msg || '获取数据失败');
      }
    } catch (e) {
      console.error('获取宽带余额失败: ' + e);
      return null;
    }
  }

  // 创建背景色 - 完全仿照国网
  createBackgroundColor() {
    return Color.dynamic(new Color('#E2E2E7'), new Color('#2C2C2F'));
  }

  // 创建左侧背景色
  createLeftBackgroundColor() {
    return Color.dynamic(new Color('#F2F2F7'), new Color('#1C1C1E'));
  }

  // 获取文字颜色
  getTextColor() {
    return Color.dynamic(new Color('#000000'), new Color('#FFFFFF'));
  }

  // 获取次要文字颜色
  getSecondaryTextColor() {
    return Color.dynamic(new Color('#666666'), new Color('#AAAAAA'));
  }

  // 创建数值显示条 - 完全仿照国网尺寸
  createValueBar(height, color) {
    const context = new DrawContext();
    context.size = new Size(8 * this.SCALE, height);
    context.opaque = false;
    context.respectScreenScale = true;
    
    context.setFillColor(new Color(color));
    context.fillRect(new Rect(0, 0, 8 * this.SCALE, height));
    
    return context.getImage();
  }

  // 创建分隔线 - 完全仿照国网
  split(stack, width, height, ver = false) {
    const splitStack = stack.addStack();
    splitStack.size = new Size(width, height);
    if (ver) splitStack.layoutVertically();
    splitStack.addSpacer();
    splitStack.backgroundColor = Color.dynamic(new Color('#B6B5BA'), new Color('#414144'));
  }

  // 设置标题 - 完全仿照国网
  setTitle(stack, iconColor, nameColor) {
    const nameStack = stack.addStack();
    const iconSFS = SFSymbol.named('house.fill');
    iconSFS.applyHeavyWeight();
    let icon = nameStack.addImage(iconSFS.image);
    icon.imageSize = new Size(20 * this.SCALE, 20 * this.SCALE);
    icon.tintColor = iconColor;
    nameStack.addSpacer(2);
    let name = nameStack.addText(this.name || '电信宽带');
    name.font = Font.mediumSystemFont(16.5 * this.SCALE);
    name.textColor = nameColor;
  }

  // 创建数据列表项 - 完全仿照国网
  setList(stack, data, color) {
    const rowStack = stack.addStack();
    rowStack.centerAlignContent();
    const lineStack = rowStack.addStack();
    lineStack.size = new Size(8 * this.SCALE, 30 * this.SCALE);
    lineStack.cornerRadius = 4 * this.SCALE;

    lineStack.backgroundColor = new Color(color);

    rowStack.addSpacer(10 * this.SCALE);

    const leftStack = rowStack.addStack();
    leftStack.layoutVertically();
    leftStack.addSpacer(2 * this.SCALE);

    const titleStack = leftStack.addStack();
    const title = titleStack.addText(data[0]);
    title.font = Font.systemFont(10 * this.SCALE);
    title.textColor = this.getTextColor();
    title.textOpacity = 0.5;

    const valueStack = leftStack.addStack();
    valueStack.centerAlignContent();
    const value = valueStack.addText(data[1]);
    value.font = Font.semiboldRoundedSystemFont(16 * this.SCALE);
    value.textColor = this.getTextColor();
    valueStack.addSpacer();

    const unitStack = valueStack.addStack();
    unitStack.cornerRadius = 4 * this.SCALE;
    unitStack.borderWidth = 1;
    unitStack.borderColor = new Color(color);
    unitStack.setPadding(1, 3 * this.SCALE, 1, 3 * this.SCALE);
    unitStack.size = new Size(30 * this.SCALE, 0)
    unitStack.backgroundColor = Color.dynamic(new Color(color), new Color(color, 0.3));
    const unit = unitStack.addText(data[2]);
    unit.font = Font.mediumRoundedSystemFont(10 * this.SCALE);
    unit.textColor = Color.dynamic(Color.white(), new Color(color));
  }

  // 单位 - 完全仿照国网
  unit(stack, text, spacer, corlor = this.getTextColor(), overDue = false) {
    stack.addSpacer(1);
    const unitStack = stack.addStack();
    unitStack.layoutVertically();
    unitStack.addSpacer(spacer);
    const unitTitle = unitStack.addText(text);
    unitTitle.font = Font.semiboldRoundedSystemFont(10 * this.SCALE);
    unitTitle.textColor = overDue ? new Color('DE2A18') : corlor;
  }

  // 更新时间 - 完全仿照国网
  setUpdateStack(stack, color) {
    const updateStack = stack.addStack();
    updateStack.addSpacer();
    updateStack.centerAlignContent();
    const updataIcon = SFSymbol.named('arrow.2.circlepath');
    updataIcon.applyHeavyWeight();
    const updateImg = updateStack.addImage(updataIcon.image);
    updateImg.tintColor = color;
    updateImg.imageOpacity = 0.5;
    updateImg.imageSize = new Size(10, 10);
    updateStack.addSpacer(3);
    const updateText = updateStack.addText(this.getTime());
    updateText.font = Font.mediumSystemFont(10);
    updateText.textColor = color;
    updateText.textOpacity = 0.5;
    updateStack.addSpacer();
  }

  // 余额展示 - 完全仿照国网
  setBalanceStack(stack, color, padding, balanceSize, titleSize, spacer) {
    const balance = this.balance || 0;
    const balanceTitle = '宽带余额';

    const bodyStack = stack.addStack();
    bodyStack.layoutVertically();
    bodyStack.cornerRadius = 10;
    bodyStack.backgroundColor = color;
    bodyStack.addSpacer(padding * this.SCALE);
    
    //  余额Stack
    const balanceStack = bodyStack.addStack();
    balanceStack.centerAlignContent();
    balanceStack.addSpacer();
    const balanceText = balanceStack.addText(`${balance}`);
    balanceText.font = Font.semiboldRoundedSystemFont(balanceSize);
    balanceText.lineLimit = 1;
    balanceText.minimumScaleFactor = 0.5;
    balanceText.textColor = this.getTextColor();
    this.unit(balanceStack, "元", spacer * this.SCALE, this.getTextColor());
    balanceStack.addSpacer();
    bodyStack.addSpacer(3 * this.SCALE);
    
    //  余额标题Stack
    const balanceTitleStack = bodyStack.addStack();
    balanceTitleStack.addSpacer();
    const balanceTitleText = balanceTitleStack.addText(balanceTitle);
    balanceTitleStack.addSpacer();
    bodyStack.addSpacer(padding * this.SCALE);

    balanceTitleText.textColor = this.getTextColor();
    balanceTitleText.font = Font.semiboldSystemFont(titleSize);
    balanceTitleText.textOpacity = 0.5;
  }

  // 获取时间
  getTime = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hour}:${minute}`;
  }

  // 添加图片处理方法
  getImageByUrl = async (url, cacheKey) => {
    const cacheImg = this.loadImgCache(cacheKey);
    if (cacheImg != undefined && cacheImg != null) {
      console.log(`使用缓存图片：${cacheKey}`);
      return this.loadImgCache(cacheKey);
    }

    try {
      console.log(`在线请求图片：${cacheKey}`);
      const req = new Request(url);
      const imgData = await req.load();
      const img = Image.fromData(imgData);
      this.saveImgCache(cacheKey, img);
      return img;
    } catch (e) {
      console.error(`图片加载失败：${e}`);
      let cacheImg = this.loadImgCache(cacheKey);
      if (cacheImg != undefined) {
        console.log(`使用缓存图片：${cacheKey}`);
        return cacheImg;
      }
      console.log(`使用默认WiFi图标`);
      // 返回默认WiFi图标
      const icon = SFSymbol.named('wifi').image;
      return icon;
    }
  };

  loadImgCache(cacheKey) {
    const cacheFile = this.fm.joinPath(this.cachePath, cacheKey);
    const fileExists = this.fm.fileExists(cacheFile);
    let img = undefined;
    if (fileExists) {
      if (this.settings.useICloud === 'true') this.fm.downloadFileFromiCloud(this.cachePath);
      img = Image.fromFile(cacheFile);
    }
    return img;
  };

  saveImgCache(cacheKey, img) {
    if (!this.fm.fileExists(this.cachePath)) {
      this.fm.createDirectory(this.cachePath, true);
    };
    const cacheFile = this.fm.joinPath(this.cachePath, cacheKey);
    this.fm.writeImage(cacheFile, img);
  };

  // 初始化缓存路径
  initCachePath() {
    try {
      if (this.settings.useICloud === 'true') this.fm = FileManager.iCloud();
      this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), this.CACHE_FOLDER);
      if (!this.fm.fileExists(this.cachePath)) {
        this.fm.createDirectory(this.cachePath, true);
      }
    } catch (e) {
      console.log(`初始化缓存路径失败: ${e}`);
    }
  }

  // 小组件布局 - 完全仿照国网 - 添加async
  async renderSmallWidget(widget, data, isDark) {
    const balance = parseFloat(data.balance || 0);
    const remainingDays = this.calculateRemainingDays(balance);
    const monthlyFee = this.getMonthlyFee();
    
    // 设置背景色 - 完全仿照国网
    widget.backgroundColor = this.createBackgroundColor();
    const padding = 12 * this.SCALE;
    widget.setPadding(padding, padding, padding, padding);
    
    const bodyStack = widget.addStack();
    bodyStack.layoutVertically();
    bodyStack.setPadding(3 * this.SCALE, 3 * this.SCALE, 3 * this.SCALE, 3 * this.SCALE);
    
    // 顶部 - 余额和Logo - 完全仿照国网
    const headerStack = bodyStack.addStack();
    const hlStack = headerStack.addStack();
    hlStack.layoutVertically();
    
    const titleStack = hlStack.addStack();
    titleStack.layoutVertically();
    const title = titleStack.addText('宽带余额');
    const balanceStack = hlStack.addStack();
    const balanceText = balanceStack.addText(`${data.balance}`);
    this.unit(balanceStack, '元', 11.5 * this.SCALE, this.getTextColor());
    
    title.font = Font.systemFont(12 * this.SCALE);
    title.textOpacity = 0.7;
    balanceText.font = Font.boldRoundedSystemFont(23 * this.SCALE);
    balanceText.minimumScaleFactor = 0.5;
    [title, balanceText].map(t => {
      t.textColor = this.getTextColor();
    });
    
    headerStack.addSpacer();
    
    // 使用现有的getImageByUrl方法获取Logo - 正确使用await
    let wsgw;
    if (this.settings.logoUrl) {
      wsgw = headerStack.addImage(await this.getImageByUrl(this.settings.logoUrl, 'broadband_logo.png'));
    } else {
      // 使用默认WiFi图标
      const icon = SFSymbol.named('wifi').image;
      wsgw = headerStack.addImage(icon);
    }
    wsgw.imageSize = new Size(26 * this.SCALE, 26 * this.SCALE);
    wsgw.tintColor = this.getTextColor();
    
    bodyStack.addSpacer();
    
    // 底部数据 - 完全仿照国网
    this.setList(bodyStack, ['可用天数', remainingDays.toString(), '天'], '#4CAF50');
    bodyStack.addSpacer();
    this.setList(bodyStack, ['每月费用', monthlyFee, '元'], '#2196F3');
  }

  // 中等组件布局 - 完全仿照国网 - 添加async
  async renderMediumWidget(widget, data, isDark) {
    const balance = parseFloat(data.balance || 0);
    const remainingDays = this.calculateRemainingDays(balance);
    const monthlyFee = this.getMonthlyFee();
    
    // 设置背景色和padding - 完全仿照国网
    widget.setPadding(0, 0, 0, 0);
    widget.backgroundColor = this.createBackgroundColor();
    const updateColor = new Color('#2F6E6B');
    const bodyStack = widget.addStack();
    
    // 左侧stack - 完全仿照国网尺寸和样式
    const leftStack = bodyStack.addStack();
    leftStack.layoutVertically();
    leftStack.setPadding(0, 15, 0, 15);
    leftStack.size = new Size(130 * this.SCALE, 0);
    leftStack.backgroundColor = this.createLeftBackgroundColor();
    
    // 标题及LOGO - 完全仿照国网
    leftStack.addSpacer();
    const logoStack = leftStack.addStack();
    logoStack.addSpacer();
    
    // 使用现有的getImageByUrl方法获取Logo - 正确使用await
    let wsgw;
    if (this.settings.logoUrl) {
      wsgw = logoStack.addImage(await this.getImageByUrl(this.settings.logoUrl, 'broadband_logo.png'));
    } else {
      // 使用默认WiFi图标
      const icon = SFSymbol.named('wifi').image;
      wsgw = logoStack.addImage(icon);
    }
    wsgw.imageSize = new Size(48 * this.SCALE, 48 * this.SCALE);
    wsgw.tintColor = this.getTextColor();
    logoStack.addSpacer();
    
    leftStack.addSpacer();
    this.setUpdateStack(leftStack, updateColor);
    leftStack.addSpacer(2);
    
    // 余额显示 - 完全仿照国网样式
    const balanceStackBgcolor = this.createBackgroundColor();
    this.balance = data.balance;
    this.setBalanceStack(leftStack, balanceStackBgcolor, 8 * this.SCALE, 20 * this.SCALE, 12 * this.SCALE, 4.5);
    leftStack.addSpacer(15);
    
    // 分隔线 - 完全仿照国网
    this.split(bodyStack, 0.5, 0, true);
    
    // 右侧Stack - 完全仿照国网
    const rightStack = bodyStack.addStack();
    rightStack.setPadding(15, 15, 15, 15);
    rightStack.layoutVertically();
    
    // 第一行数据
    const firstRow = rightStack.addStack();
    firstRow.layoutHorizontally();
    firstRow.spacing = 12;
    
    // 可用天数
    const remainingStack = firstRow.addStack();
    remainingStack.layoutHorizontally();
    remainingStack.centerAlignContent();
    
    const remainingBar = remainingStack.addImage(this.createValueBar(30 * this.SCALE, '#4CAF50'));
    remainingStack.addSpacer(10 * this.SCALE);
    
    const remainingContent = remainingStack.addStack();
    remainingContent.layoutVertically();
    remainingContent.addSpacer(2 * this.SCALE);
    
    const remainingTitle = remainingContent.addText('可用天数');
    remainingTitle.font = Font.systemFont(10 * this.SCALE);
    remainingTitle.textColor = this.getTextColor();
    remainingTitle.textOpacity = 0.5;
    
    const remainingValueStack = remainingContent.addStack();
    remainingValueStack.centerAlignContent();
    
    const remainingValue = remainingValueStack.addText(remainingDays.toString());
    remainingValue.font = Font.boldRoundedSystemFont(16 * this.SCALE);
    remainingValue.textColor = this.getTextColor();
    
    remainingValueStack.addSpacer();
    
    const remainingUnitStack = remainingValueStack.addStack();
    remainingUnitStack.cornerRadius = 4 * this.SCALE;
    remainingUnitStack.borderWidth = 1;
    remainingUnitStack.borderColor = new Color('#4CAF50');
    remainingUnitStack.setPadding(1, 3 * this.SCALE, 1, 3 * this.SCALE);
    remainingUnitStack.backgroundColor = Color.dynamic(new Color('#4CAF50'), new Color('#4CAF50', 0.3));
    
    const remainingUnit = remainingUnitStack.addText('天');
    remainingUnit.font = Font.mediumRoundedSystemFont(10 * this.SCALE);
    remainingUnit.textColor = Color.dynamic(Color.white(), new Color('#4CAF50'));
    
    // 每月费用
    const monthlyStack = firstRow.addStack();
    monthlyStack.layoutHorizontally();
    monthlyStack.centerAlignContent();
    
    const monthlyBar = monthlyStack.addImage(this.createValueBar(30 * this.SCALE, '#2196F3'));
    monthlyStack.addSpacer(10 * this.SCALE);
    
    const monthlyContent = monthlyStack.addStack();
    monthlyContent.layoutVertically();
    monthlyContent.addSpacer(2 * this.SCALE);
    
    const monthlyTitle = monthlyContent.addText('每月费用');
    monthlyTitle.font = Font.systemFont(10 * this.SCALE);
    monthlyTitle.textColor = this.getTextColor();
    monthlyTitle.textOpacity = 0.5;
    
    const monthlyValueStack = monthlyContent.addStack();
    monthlyValueStack.centerAlignContent();
    
    const monthlyValue = monthlyValueStack.addText(monthlyFee);
    monthlyValue.font = Font.boldRoundedSystemFont(16 * this.SCALE);
    monthlyValue.textColor = this.getTextColor();
    
    monthlyValueStack.addSpacer();
    
    const monthlyUnitStack = monthlyValueStack.addStack();
    monthlyUnitStack.cornerRadius = 4 * this.SCALE;
    monthlyUnitStack.borderWidth = 1;
    monthlyUnitStack.borderColor = new Color('#2196F3');
    monthlyUnitStack.setPadding(1, 3 * this.SCALE, 1, 3 * this.SCALE);
    monthlyUnitStack.backgroundColor = Color.dynamic(new Color('#2196F3'), new Color('#2196F3', 0.3));
    
    const monthlyUnit = monthlyUnitStack.addText('元');
    monthlyUnit.font = Font.mediumRoundedSystemFont(10 * this.SCALE);
    monthlyUnit.textColor = Color.dynamic(Color.white(), new Color('#2196F3'));
    
    rightStack.addSpacer();
    
    // 分隔线 - 完全仿照国网
    this.split(rightStack, 0, 0.5 * this.SCALE);
    
    rightStack.addSpacer();
    
    // 第二行数据 - 套餐类型和状态
    const secondRow = rightStack.addStack();
    secondRow.layoutHorizontally();
    secondRow.spacing = 12;
    
    // 套餐类型
    const leftPlaceholder = secondRow.addStack();
    leftPlaceholder.layoutHorizontally();
    leftPlaceholder.centerAlignContent();
    
    const leftPlaceholderBar = leftPlaceholder.addImage(this.createValueBar(30 * this.SCALE, '#FFB347'));
    leftPlaceholder.addSpacer(10 * this.SCALE);
    
    const leftPlaceholderContent = leftPlaceholder.addStack();
    leftPlaceholderContent.layoutVertically();
    leftPlaceholderContent.addSpacer(2 * this.SCALE);
    
    const leftPlaceholderTitle = leftPlaceholderContent.addText('套餐类型');
    leftPlaceholderTitle.font = Font.systemFont(10 * this.SCALE);
    leftPlaceholderTitle.textColor = this.getTextColor();
    leftPlaceholderTitle.textOpacity = 0.5;
    
    const leftPlaceholderValueStack = leftPlaceholderContent.addStack();
    leftPlaceholderValueStack.centerAlignContent();
    
    const packageType = this.settings.packageType || '包月';
    const leftPlaceholderValue = leftPlaceholderValueStack.addText(packageType);
    leftPlaceholderValue.font = Font.boldRoundedSystemFont(16 * this.SCALE);
    leftPlaceholderValue.textColor = this.getTextColor();
    
    leftPlaceholderValueStack.addSpacer();
    
    // 状态
    const rightPlaceholder = secondRow.addStack();
    rightPlaceholder.layoutHorizontally();
    rightPlaceholder.centerAlignContent();
    
    const rightPlaceholderBar = rightPlaceholder.addImage(this.createValueBar(30 * this.SCALE, '#9C27B0'));
    rightPlaceholder.addSpacer(10 * this.SCALE);
    
    const rightPlaceholderContent = rightPlaceholder.addStack();
    rightPlaceholderContent.layoutVertically();
    rightPlaceholderContent.addSpacer(2 * this.SCALE);
    
    const rightPlaceholderTitle = rightPlaceholderContent.addText('状态');
    rightPlaceholderTitle.font = Font.systemFont(10 * this.SCALE);
    rightPlaceholderTitle.textColor = this.getTextColor();
    rightPlaceholderTitle.textOpacity = 0.5;
    
    const rightPlaceholderValueStack = rightPlaceholderContent.addStack();
    rightPlaceholderValueStack.centerAlignContent();
    
    const statusText = balance > 30 ? '正常' : balance > 10 ? '偏低' : '不足';
    const rightPlaceholderValue = rightPlaceholderValueStack.addText(statusText);
    rightPlaceholderValue.font = Font.boldRoundedSystemFont(16 * this.SCALE);
    rightPlaceholderValue.textColor = this.getTextColor();
    
    rightPlaceholderValueStack.addSpacer();
  }

  // 大组件布局 - 完全仿照国网上下布局 - 添加async
  async renderLargeWidget(widget, data, isDark) {
    const balance = parseFloat(data.balance || 0);
    const remainingDays = this.calculateRemainingDays(balance);
    const monthlyFee = this.getMonthlyFee();
    
    // 设置背景色
    widget.backgroundColor = this.createBackgroundColor();
    widget.setPadding(16, 16, 16, 16);
    
    // 顶部时间显示 - 完全仿照国网
    const timeStack = widget.addStack();
    timeStack.addSpacer();
    const updateTime = this.getTime();
    const timeText = timeStack.addText(updateTime);
    timeText.font = Font.systemFont(12);
    timeText.textColor = this.getSecondaryTextColor();
    timeText.textOpacity = 0.5;
    timeStack.addSpacer();
    
    widget.addSpacer(20);
    
    // 主要余额卡片 - 上半部分，完全仿照国网
    const mainBalanceCard = widget.addStack();
    mainBalanceCard.layoutVertically();
    mainBalanceCard.backgroundColor = this.createLeftBackgroundColor();
    mainBalanceCard.cornerRadius = 18;
    mainBalanceCard.setPadding(24, 24, 24, 24);
    
    const balanceHeader = mainBalanceCard.addStack();
    balanceHeader.layoutHorizontally();
    balanceHeader.centerAlignContent();
    
    const balanceLabel = balanceHeader.addText('当前宽带余额');
    balanceLabel.font = Font.mediumSystemFont(16);
    balanceLabel.textColor = this.getSecondaryTextColor();
    
    balanceHeader.addSpacer();
    
    const currencySymbol = balanceHeader.addText('¥');
    currencySymbol.font = Font.boldSystemFont(20);
    currencySymbol.textColor = this.getTextColor();
    
    mainBalanceCard.addSpacer(12);
    
    // 余额数值
    const balanceValue = mainBalanceCard.addText(data.balance);
    balanceValue.font = Font.boldSystemFont(48);
    balanceValue.textColor = new Color(this.getStatusColor(balance));
    balanceValue.centerAlignText();
    
    widget.addSpacer(20);
    
    // 详细信息区域 - 下半部分，完全仿照国网
    const detailsContainer = widget.addStack();
    detailsContainer.layoutVertically();
    detailsContainer.backgroundColor = this.createLeftBackgroundColor();
    detailsContainer.cornerRadius = 16;
    detailsContainer.setPadding(20, 20, 20, 20);
    
    // 第一行数据
    const firstRow = detailsContainer.addStack();
    firstRow.layoutHorizontally();
    firstRow.spacing = 16;
    
    // 可用天数
    const remainingStack = firstRow.addStack();
    remainingStack.layoutHorizontally();
    remainingStack.centerAlignContent();
    
    const remainingBar = remainingStack.addImage(this.createValueBar(35 * this.SCALE, '#4CAF50'));
    remainingStack.addSpacer(10);
    
    const remainingContent = remainingStack.addStack();
    remainingContent.layoutVertically();
    remainingContent.addSpacer(2);
    
    const remainingTitle = remainingContent.addText('可用天数');
    remainingTitle.font = Font.systemFont(12);
    remainingTitle.textColor = this.getSecondaryTextColor();
    remainingTitle.textOpacity = 0.7;
    
    const remainingValueStack = remainingContent.addStack();
    remainingValueStack.centerAlignContent();
    
    const remainingValue = remainingValueStack.addText(remainingDays.toString());
    remainingValue.font = Font.boldRoundedSystemFont(20);
    remainingValue.textColor = this.getTextColor();
    
    remainingValueStack.addSpacer(6);
    
    const remainingUnitStack = remainingValueStack.addStack();
    remainingUnitStack.cornerRadius = 4;
    remainingUnitStack.borderWidth = 1;
    remainingUnitStack.borderColor = new Color('#4CAF50');
    remainingUnitStack.setPadding(1, 3, 1, 3);
    remainingUnitStack.backgroundColor = Color.dynamic(new Color('#4CAF50'), new Color('#4CAF50', 0.3));
    
    const remainingUnit = remainingUnitStack.addText('天');
    remainingUnit.font = Font.mediumRoundedSystemFont(12);
    remainingUnit.textColor = Color.dynamic(Color.white(), new Color('#4CAF50'));
    
    // 每月费用
    const monthlyStack = firstRow.addStack();
    monthlyStack.layoutHorizontally();
    monthlyStack.centerAlignContent();
    
    const monthlyBar = monthlyStack.addImage(this.createValueBar(35 * this.SCALE, '#2196F3'));
    monthlyStack.addSpacer(10);
    
    const monthlyContent = monthlyStack.addStack();
    monthlyContent.layoutVertically();
    monthlyContent.addSpacer(2);
    
    const monthlyTitle = monthlyContent.addText('每月费用');
    monthlyTitle.font = Font.systemFont(12);
    monthlyTitle.textColor = this.getSecondaryTextColor();
    monthlyTitle.textOpacity = 0.7;
    
    const monthlyValueStack = monthlyContent.addStack();
    monthlyValueStack.centerAlignContent();
    
    const monthlyValue = monthlyValueStack.addText(monthlyFee);
    monthlyValue.font = Font.boldRoundedSystemFont(20);
    monthlyValue.textColor = this.getTextColor();
    
    monthlyValueStack.addSpacer(6);
    
    const monthlyUnitStack = monthlyValueStack.addStack();
    monthlyUnitStack.cornerRadius = 4;
    monthlyUnitStack.borderWidth = 1;
    monthlyUnitStack.borderColor = new Color('#2196F3');
    monthlyUnitStack.setPadding(1, 3, 1, 3);
    monthlyUnitStack.backgroundColor = Color.dynamic(new Color('#2196F3'), new Color('#2196F3', 0.3));
    
    const monthlyUnit = monthlyUnitStack.addText('元');
    monthlyUnit.font = Font.mediumRoundedSystemFont(12);
    monthlyUnit.textColor = Color.dynamic(Color.white(), new Color('#2196F3'));
    
    detailsContainer.addSpacer(15);
    
    // 第二行数据
    const secondRow = detailsContainer.addStack();
    secondRow.layoutHorizontally();
    secondRow.spacing = 16;
    
    // 套餐类型
    const packageStack = secondRow.addStack();
    packageStack.layoutHorizontally();
    packageStack.centerAlignContent();
    
    const packageBar = packageStack.addImage(this.createValueBar(35 * this.SCALE, '#FFB347'));
    packageStack.addSpacer(10);
    
    const packageContent = packageStack.addStack();
    packageContent.layoutVertically();
    packageContent.addSpacer(2);
    
    const packageTitle = packageContent.addText('套餐类型');
    packageTitle.font = Font.systemFont(12);
    packageTitle.textColor = this.getSecondaryTextColor();
    packageTitle.textOpacity = 0.7;
    
    const packageValueStack = packageContent.addStack();
    packageValueStack.centerAlignContent();
    
    const packageType = this.settings.packageType || '包月';
    const packageValue = packageValueStack.addText(packageType);
    packageValue.font = Font.boldRoundedSystemFont(20);
    packageValue.textColor = this.getTextColor();
    
    packageValueStack.addSpacer(6);
    
    // 状态
    const statusStack = secondRow.addStack();
    statusStack.layoutHorizontally();
    statusStack.centerAlignContent();
    
    const statusBar = statusStack.addImage(this.createValueBar(35 * this.SCALE, '#9C27B0'));
    statusStack.addSpacer(10);
    
    const statusContent = statusStack.addStack();
    statusContent.layoutVertically();
    statusContent.addSpacer(2);
    
    const statusTitle = statusContent.addText('余额状态');
    statusTitle.font = Font.systemFont(12);
    statusTitle.textColor = this.getSecondaryTextColor();
    statusTitle.textOpacity = 0.7;
    
    const statusValueStack = statusContent.addStack();
    statusValueStack.centerAlignContent();
    
    const statusText = balance > 30 ? '正常' : balance > 10 ? '偏低' : '不足';
    const statusValue = statusValueStack.addText(statusText);
    statusValue.font = Font.boldRoundedSystemFont(20);
    statusValue.textColor = this.getTextColor();
    
    statusValueStack.addSpacer(6);
  }

  // 错误状态组件 - 完全仿照国网
  renderErrorWidget(widget, isDark) {
    widget.backgroundColor = this.createBackgroundColor();
    
    const errorContainer = widget.addStack();
    errorContainer.layoutVertically();
    errorContainer.centerAlignContent();
    
    const errorIcon = errorContainer.addText('⚠️');
    errorIcon.font = Font.systemFont(48);
    errorContainer.addSpacer(15);
    
    const errorTitle = errorContainer.addText('连接失败');
    errorTitle.font = Font.boldSystemFont(20);
    errorTitle.textColor = this.getTextColor();
    errorTitle.centerAlignText();
    
    errorContainer.addSpacer(8);
    
    const errorDesc = errorContainer.addText('请检查网络连接或配置信息');
    errorDesc.font = Font.systemFont(14);
    errorDesc.textColor = this.getSecondaryTextColor();
    errorDesc.centerAlignText();
    
    errorContainer.addSpacer(12);
    
    const retryHint = errorContainer.addText('点击重试');
    retryHint.font = Font.systemFont(12);
    retryHint.textColor = this.getSecondaryTextColor();
    retryHint.centerAlignText();
    
    widget.url = 'scriptable:///run?scriptName=' + Script.name();
  }

  // 脚本更新功能
  async updateScript() {
    const alert = new Alert();
    alert.title = "脚本更新";
    alert.message = "是否立即更新电信宽带脚本？更新后需要重新运行脚本。";
    alert.addAction("更新");
    alert.addCancelAction("取消");

    const response = await alert.presentAlert();
    if (response === 0) {
      try {
        const downloadUrl = 'https://raw.githubusercontent.com/your-repo/scripts/main/电信宽带.js';
        const scriptName = Script.name() + '.js';

        const updateRequest = new Request(downloadUrl);
        const newScriptContent = await updateRequest.loadString();

        const fm = FileManager[
          module.filename.includes('Documents/iCloud~') ? 'iCloud' : 'local'
        ]();
        const scriptPath = fm.documentsDirectory() + `/${scriptName}`;
        fm.writeString(scriptPath, newScriptContent);

        const successAlert = new Alert();
        successAlert.title = "更新成功";
        successAlert.message = "脚本已更新，请关闭本脚本后重新打开!";
        successAlert.addAction("确定");
        await successAlert.present();
        this.reopenScript();
      } catch (e) {
        const errorAlert = new Alert();
        errorAlert.title = "更新失败";
        errorAlert.message = `更新过程中出现错误: ${e.message}`;
        errorAlert.addAction("确定");
        await errorAlert.present();
      }
    }
  }

  // UI 主渲染
  async renderWidget() {
    const widget = new ListWidget();
    const family = config.widgetFamily || 'medium';
    const isDark = Device.isUsingDarkAppearance();
  
    // 初始化缓存路径
    this.initCachePath();
  
    const data = await this.fetchBalanceData();
  
    if (data) {
      if (family === 'small') {
        await this.renderSmallWidget(widget, data, isDark); // 添加await
      } else if (family === 'medium') {
        await this.renderMediumWidget(widget, data, isDark); // 添加await
      } else {
        await this.renderLargeWidget(widget, data, isDark); // 添加await
      }
    } else {
      this.renderErrorWidget(widget, isDark);
    }
  
    return widget;
  }

  // 配置菜单
  Run() {
    if (config.runsInApp) {
      this.registerAction({
        title: '宽带余额设置',
        menu: [
          {
            title: 'iCloud存储',
            type: 'switch',
            val: 'useICloud',
            desc: '开启后缓存文件将存储在iCloud中'
          },
          {
            title: '配置zgk12BhG参数',
            type: 'input',
            val: 'zgk12BhG',
            desc: '输入从抓包获取的zgk12BhG参数值',
            placeholder: ''
          },
          {
            title: '配置Cookie',
            type: 'input',
            val: 'broadband_cookie',
            desc: '输入从抓包获取的Cookie值',
            placeholder: ''
          },
          {
            title: '套餐类型',
            type: 'select',
            val: 'packageType',
            desc: '选择您的套餐类型',
            options: ['包月', '包年']
          },
          {
            title: '套餐费用',
            type: 'input',
            val: 'packageFee',
            desc: '输入套餐费用（元）',
            placeholder: '例如：99'
          },
          {
            title: 'Logo图片地址',
            type: 'input',
            val: 'logoUrl',
            desc: '输入自定义Logo图片URL地址，留空使用默认WiFi图标',
            placeholder: 'https://example.com/logo.png'
          },
          {
            name: 'test',
            title: '测试连接',
            onClick: async () => {
              const alert = new Alert();
              try {
                const data = await this.fetchBalanceData();
                if (data) {
                  const balance = parseFloat(data.balance || 0);
                  const remainingDays = this.calculateRemainingDays(balance);
                  const monthlyFee = this.getMonthlyFee();
                  alert.title = '连接成功';
                  alert.message = `宽带余额: ¥${data.balance}\n可用天数: ${remainingDays}天\n每月费用: ${monthlyFee}元`;
                } else {
                  alert.title = '连接失败';
                  alert.message = '未能获取数据，请检查配置';
                }
              } catch (e) {
                alert.title = '发生错误';
                alert.message = e.message;
              }
              await alert.present();
            }
          },
          {
            name: 'update',
            title: '脚本更新',
            onClick: async () => {
              await this.updateScript();
            }
          },
          {
            name: 'redata',
            title: '手动刷新',
            onClick: () => {
              this.reopenScript();
            }
          }
        ]
      });
    }
  }
}

await Runing(BroadbandWidget, args.widgetParameter, false);
