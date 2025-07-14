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

  // 创建数值显示条 - 完全仿照国网样式
  createValueBar(height, color) {
    const context = new DrawContext();
    context.size = new Size(8, height);
    context.opaque = false;
    context.respectScreenScale = true;
    
    context.setFillColor(new Color(color));
    context.fillRect(new Rect(0, 0, 8, height));
    
    return context.getImage();
  }

  // 创建数据项 - 完全仿照国网样式
  createDataItem(parentStack, title, value, unit, color) {
    const itemStack = parentStack.addStack();
    itemStack.layoutHorizontally();
    itemStack.centerAlignContent();
    
    // 左侧彩色条
    const colorBar = itemStack.addImage(this.createValueBar(30, color));
    
    itemStack.addSpacer(10);
    
    // 右侧内容
    const contentStack = itemStack.addStack();
    contentStack.layoutVertically();
    contentStack.addSpacer(2);
    
    // 标题
    const titleText = contentStack.addText(title);
    titleText.font = Font.systemFont(12);
    titleText.textColor = this.getSecondaryTextColor();
    titleText.textOpacity = 0.7;
    
    // 数值和单位
    const valueStack = contentStack.addStack();
    valueStack.centerAlignContent();
    
    const valueText = valueStack.addText(value);
    valueText.font = Font.boldRoundedSystemFont(18);
    valueText.textColor = this.getTextColor();
    
    valueStack.addSpacer();
    
    // 单位标签 - 完全仿照国网样式
    const unitStack = valueStack.addStack();
    unitStack.cornerRadius = 4;
    unitStack.borderWidth = 1;
    unitStack.borderColor = new Color(color);
    unitStack.setPadding(1, 3, 1, 3);
    unitStack.backgroundColor = Color.dynamic(new Color(color), new Color(color, 0.3));
    
    const unitText = unitStack.addText(unit);
    unitText.font = Font.mediumRoundedSystemFont(10);
    unitText.textColor = Color.dynamic(Color.white(), new Color(color));
    
    return itemStack;
  }

  // 小组件布局 - 完全仿照国网样式
  renderSmallWidget(widget, data, isDark) {
    const balance = parseFloat(data.balance || 0);
    const remainingDays = this.calculateRemainingDays(balance);
    const monthlyFee = this.getMonthlyFee();
    
    // 设置背景色
    widget.backgroundColor = this.createBackgroundColor();
    
    // 顶部时间显示
    const timeStack = widget.addStack();
    timeStack.addSpacer();
    const updateTime = new Date().toLocaleString('zh-CN', { 
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const timeText = timeStack.addText(updateTime);
    timeText.font = Font.systemFont(12);
    timeText.textColor = this.getSecondaryTextColor();
    timeText.textOpacity = 0.5;
    timeStack.addSpacer();
    
    widget.addSpacer(18);
    
    // 主要余额显示
    const balanceStack = widget.addStack();
    balanceStack.layoutVertically();
    
    const balanceValue = balanceStack.addText(data.balance);
    balanceValue.font = Font.boldRoundedSystemFont(48);
    balanceValue.textColor = new Color(this.getStatusColor(balance));
    balanceValue.minimumScaleFactor = 0.8;
    
    balanceStack.addSpacer(4);
    
    const balanceLabel = balanceStack.addText('宽带余额');
    balanceLabel.font = Font.systemFont(12);
    balanceLabel.textColor = this.getSecondaryTextColor();
    balanceLabel.textOpacity = 0.7;
    
    widget.addSpacer(20);
    
    // 底部数据显示
    const dataStack = widget.addStack();
    dataStack.layoutVertically();
    dataStack.spacing = 12;
    
    // 可用天数
    this.createDataItem(dataStack, '可用天数', remainingDays.toString(), '天', '#4CAF50');
    
    // 每月费用
    this.createDataItem(dataStack, '每月费用', monthlyFee, '元', '#2196F3');
  }

  // 中等组件布局 - 完全仿照国网样式
  renderMediumWidget(widget, data, isDark) {
    const balance = parseFloat(data.balance || 0);
    const remainingDays = this.calculateRemainingDays(balance);
    const monthlyFee = this.getMonthlyFee();
    
    // 设置背景色
    widget.backgroundColor = this.createBackgroundColor();
    widget.setPadding(0, 0, 0, 0);
    
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    
    // 左侧 - 余额展示区域
    const leftStack = mainStack.addStack();
    leftStack.layoutVertically();
    leftStack.size = new Size(130, 0);
    leftStack.backgroundColor = this.createLeftBackgroundColor();
    leftStack.setPadding(0, 15, 0, 15);
    
    leftStack.addSpacer(15);
    
    // 时间显示
    const timeStack = leftStack.addStack();
    timeStack.addSpacer();
    const updateTime = new Date().toLocaleString('zh-CN', { 
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const timeText = timeStack.addText(updateTime);
    timeText.font = Font.systemFont(10);
    timeText.textColor = this.getSecondaryTextColor();
    timeText.textOpacity = 0.5;
    timeStack.addSpacer();
    
    leftStack.addSpacer();
    
    // 余额展示
    const balanceContainer = leftStack.addStack();
    balanceContainer.layoutVertically();
    balanceContainer.backgroundColor = this.createBackgroundColor();
    balanceContainer.cornerRadius = 10;
    balanceContainer.setPadding(8, 8, 8, 8);
    
    const balanceLabel = balanceContainer.addText('宽带余额');
    balanceLabel.font = Font.systemFont(12);
    balanceLabel.textColor = this.getSecondaryTextColor();
    balanceLabel.textOpacity = 0.7;
    
    balanceContainer.addSpacer(4);
    
    const balanceValueStack = balanceContainer.addStack();
    balanceValueStack.centerAlignContent();
    balanceValueStack.addSpacer();
    
    const balanceValue = balanceValueStack.addText(data.balance);
    balanceValue.font = Font.boldRoundedSystemFont(24);
    balanceValue.textColor = new Color(this.getStatusColor(balance));
    balanceValue.minimumScaleFactor = 0.8;
    
    balanceValueStack.addSpacer();
    
    balanceContainer.addSpacer(2);
    
    const unitStack = balanceContainer.addStack();
    unitStack.addSpacer();
    const unitText = unitStack.addText('元');
    unitText.font = Font.systemFont(12);
    unitText.textColor = this.getSecondaryTextColor();
    unitText.textOpacity = 0.7;
    unitStack.addSpacer();
    
    leftStack.addSpacer(15);
    
    // 分隔线
    const separatorStack = mainStack.addStack();
    separatorStack.size = new Size(0.5, 0);
    separatorStack.backgroundColor = Color.dynamic(new Color('#B6B5BA'), new Color('#414144'));
    
    // 右侧 - 数据展示区域
    const rightStack = mainStack.addStack();
    rightStack.layoutVertically();
    rightStack.setPadding(15, 15, 15, 15);
    
    // 第一行数据
    const firstRow = rightStack.addStack();
    firstRow.layoutHorizontally();
    firstRow.spacing = 12;
    
    // 可用天数
    const remainingStack = firstRow.addStack();
    remainingStack.layoutHorizontally();
    remainingStack.centerAlignContent();
    
    const remainingBar = remainingStack.addImage(this.createValueBar(30, '#4CAF50'));
    remainingStack.addSpacer(10);
    
    const remainingContent = remainingStack.addStack();
    remainingContent.layoutVertically();
    remainingContent.addSpacer(2);
    
    const remainingTitle = remainingContent.addText('可用天数');
    remainingTitle.font = Font.systemFont(10);
    remainingTitle.textColor = this.getSecondaryTextColor();
    remainingTitle.textOpacity = 0.7;
    
    const remainingValueStack = remainingContent.addStack();
    remainingValueStack.centerAlignContent();
    
    const remainingValue = remainingValueStack.addText(remainingDays.toString());
    remainingValue.font = Font.boldRoundedSystemFont(16);
    remainingValue.textColor = this.getTextColor();
    
    remainingValueStack.addSpacer();
    
    const remainingUnitStack = remainingValueStack.addStack();
    remainingUnitStack.cornerRadius = 4;
    remainingUnitStack.borderWidth = 1;
    remainingUnitStack.borderColor = new Color('#4CAF50');
    remainingUnitStack.setPadding(1, 3, 1, 3);
    remainingUnitStack.backgroundColor = Color.dynamic(new Color('#4CAF50'), new Color('#4CAF50', 0.3));
    
    const remainingUnit = remainingUnitStack.addText('天');
    remainingUnit.font = Font.mediumRoundedSystemFont(10);
    remainingUnit.textColor = Color.dynamic(Color.white(), new Color('#4CAF50'));
    
    // 每月费用
    const monthlyStack = firstRow.addStack();
    monthlyStack.layoutHorizontally();
    monthlyStack.centerAlignContent();
    
    const monthlyBar = monthlyStack.addImage(this.createValueBar(30, '#2196F3'));
    monthlyStack.addSpacer(10);
    
    const monthlyContent = monthlyStack.addStack();
    monthlyContent.layoutVertically();
    monthlyContent.addSpacer(2);
    
    const monthlyTitle = monthlyContent.addText('每月费用');
    monthlyTitle.font = Font.systemFont(10);
    monthlyTitle.textColor = this.getSecondaryTextColor();
    monthlyTitle.textOpacity = 0.7;
    
    const monthlyValueStack = monthlyContent.addStack();
    monthlyValueStack.centerAlignContent();
    
    const monthlyValue = monthlyValueStack.addText(monthlyFee);
    monthlyValue.font = Font.boldRoundedSystemFont(16);
    monthlyValue.textColor = this.getTextColor();
    
    monthlyValueStack.addSpacer();
    
    const monthlyUnitStack = monthlyValueStack.addStack();
    monthlyUnitStack.cornerRadius = 4;
    monthlyUnitStack.borderWidth = 1;
    monthlyUnitStack.borderColor = new Color('#2196F3');
    monthlyUnitStack.setPadding(1, 3, 1, 3);
    monthlyUnitStack.backgroundColor = Color.dynamic(new Color('#2196F3'), new Color('#2196F3', 0.3));
    
    const monthlyUnit = monthlyUnitStack.addText('元');
    monthlyUnit.font = Font.mediumRoundedSystemFont(10);
    monthlyUnit.textColor = Color.dynamic(Color.white(), new Color('#2196F3'));
    
    rightStack.addSpacer();
    
    // 分隔线
    const dividerStack = rightStack.addStack();
    dividerStack.size = new Size(0, 0.5);
    dividerStack.backgroundColor = Color.dynamic(new Color('#B6B5BA'), new Color('#414144'));
    
    rightStack.addSpacer();
    
    // 第二行空白区域（保持和国网一致的布局）
    const secondRow = rightStack.addStack();
    secondRow.layoutHorizontally();
    secondRow.spacing = 12;
    
    // 左侧占位
    const leftPlaceholder = secondRow.addStack();
    leftPlaceholder.layoutHorizontally();
    leftPlaceholder.centerAlignContent();
    
    const leftPlaceholderBar = leftPlaceholder.addImage(this.createValueBar(30, '#FFB347'));
    leftPlaceholder.addSpacer(10);
    
    const leftPlaceholderContent = leftPlaceholder.addStack();
    leftPlaceholderContent.layoutVertically();
    leftPlaceholderContent.addSpacer(2);
    
    const leftPlaceholderTitle = leftPlaceholderContent.addText('套餐类型');
    leftPlaceholderTitle.font = Font.systemFont(10);
    leftPlaceholderTitle.textColor = this.getSecondaryTextColor();
    leftPlaceholderTitle.textOpacity = 0.7;
    
    const leftPlaceholderValueStack = leftPlaceholderContent.addStack();
    leftPlaceholderValueStack.centerAlignContent();
    
    const packageType = this.settings.packageType || '包月';
    const leftPlaceholderValue = leftPlaceholderValueStack.addText(packageType);
    leftPlaceholderValue.font = Font.boldRoundedSystemFont(16);
    leftPlaceholderValue.textColor = this.getTextColor();
    
    leftPlaceholderValueStack.addSpacer();
    
    // 右侧占位
    const rightPlaceholder = secondRow.addStack();
    rightPlaceholder.layoutHorizontally();
    rightPlaceholder.centerAlignContent();
    
    const rightPlaceholderBar = rightPlaceholder.addImage(this.createValueBar(30, '#9C27B0'));
    rightPlaceholder.addSpacer(10);
    
    const rightPlaceholderContent = rightPlaceholder.addStack();
    rightPlaceholderContent.layoutVertically();
    rightPlaceholderContent.addSpacer(2);
    
    const rightPlaceholderTitle = rightPlaceholderContent.addText('状态');
    rightPlaceholderTitle.font = Font.systemFont(10);
    rightPlaceholderTitle.textColor = this.getSecondaryTextColor();
    rightPlaceholderTitle.textOpacity = 0.7;
    
    const rightPlaceholderValueStack = rightPlaceholderContent.addStack();
    rightPlaceholderValueStack.centerAlignContent();
    
    const statusText = balance > 30 ? '正常' : balance > 10 ? '偏低' : '不足';
    const rightPlaceholderValue = rightPlaceholderValueStack.addText(statusText);
    rightPlaceholderValue.font = Font.boldRoundedSystemFont(16);
    rightPlaceholderValue.textColor = this.getTextColor();
    
    rightPlaceholderValueStack.addSpacer();
    
    const rightPlaceholderUnitStack = rightPlaceholderValueStack.addStack();
    rightPlaceholderUnitStack.cornerRadius = 4;
    rightPlaceholderUnitStack.borderWidth = 1;
    rightPlaceholderUnitStack.borderColor = new Color('#9C27B0');
    rightPlaceholderUnitStack.setPadding(1, 3, 1, 3);
    rightPlaceholderUnitStack.backgroundColor = Color.dynamic(new Color('#9C27B0'), new Color('#9C27B0', 0.3));
    
    const rightPlaceholderUnit = rightPlaceholderUnitStack.addText('');
    rightPlaceholderUnit.font = Font.mediumRoundedSystemFont(10);
    rightPlaceholderUnit.textColor = Color.dynamic(Color.white(), new Color('#9C27B0'));
  }

  // 大组件布局 - 扩展版本
  renderLargeWidget(widget, data, isDark) {
    const balance = parseFloat(data.balance || 0);
    const remainingDays = this.calculateRemainingDays(balance);
    const monthlyFee = this.getMonthlyFee();
    
    // 设置背景色
    widget.backgroundColor = this.createBackgroundColor();
    widget.setPadding(0, 0, 0, 0);
    
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    
    // 左侧 - 余额展示区域
    const leftStack = mainStack.addStack();
    leftStack.layoutVertically();
    leftStack.size = new Size(160, 0);
    leftStack.backgroundColor = this.createLeftBackgroundColor();
    leftStack.setPadding(0, 20, 0, 20);
    
    leftStack.addSpacer(20);
    
    // 时间显示
    const timeStack = leftStack.addStack();
    timeStack.addSpacer();
    const updateTime = new Date().toLocaleString('zh-CN', { 
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const timeText = timeStack.addText(updateTime);
    timeText.font = Font.systemFont(12);
    timeText.textColor = this.getSecondaryTextColor();
    timeText.textOpacity = 0.5;
    timeStack.addSpacer();
    
    leftStack.addSpacer();
    
    // 余额展示
    const balanceContainer = leftStack.addStack();
    balanceContainer.layoutVertically();
    balanceContainer.backgroundColor = this.createBackgroundColor();
    balanceContainer.cornerRadius = 12;
    balanceContainer.setPadding(12, 12, 12, 12);
    
    const balanceLabel = balanceContainer.addText('宽带余额');
    balanceLabel.font = Font.systemFont(14);
    balanceLabel.textColor = this.getSecondaryTextColor();
    balanceLabel.textOpacity = 0.7;
    
    balanceContainer.addSpacer(8);
    
    const balanceValueStack = balanceContainer.addStack();
    balanceValueStack.centerAlignContent();
    balanceValueStack.addSpacer();
    
    const balanceValue = balanceValueStack.addText(data.balance);
    balanceValue.font = Font.boldRoundedSystemFont(32);
    balanceValue.textColor = new Color(this.getStatusColor(balance));
    balanceValue.minimumScaleFactor = 0.8;
    
    balanceValueStack.addSpacer();
    
    balanceContainer.addSpacer(6);
    
    const unitStack = balanceContainer.addStack();
    unitStack.addSpacer();
    const unitText = unitStack.addText('元');
    unitText.font = Font.systemFont(14);
    unitText.textColor = this.getSecondaryTextColor();
    unitText.textOpacity = 0.7;
    unitStack.addSpacer();
    
    leftStack.addSpacer(20);
    
    // 分隔线
    const separatorStack = mainStack.addStack();
    separatorStack.size = new Size(0.5, 0);
    separatorStack.backgroundColor = Color.dynamic(new Color('#B6B5BA'), new Color('#414144'));
    
    // 右侧 - 数据展示区域
    const rightStack = mainStack.addStack();
    rightStack.layoutVertically();
    rightStack.setPadding(20, 20, 20, 20);
    
    // 第一行数据
    const firstRow = rightStack.addStack();
    firstRow.layoutHorizontally();
    firstRow.spacing = 18;
    
    // 可用天数
    const remainingStack = firstRow.addStack();
    remainingStack.layoutHorizontally();
    remainingStack.centerAlignContent();
    
    const remainingBar = remainingStack.addImage(this.createValueBar(40, '#4CAF50'));
    remainingStack.addSpacer(12);
    
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
    
    const monthlyBar = monthlyStack.addImage(this.createValueBar(40, '#2196F3'));
    monthlyStack.addSpacer(12);
    
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
    
    rightStack.addSpacer(18);
    
    // 分隔线
    const dividerStack = rightStack.addStack();
    dividerStack.size = new Size(0, 0.5);
    dividerStack.backgroundColor = Color.dynamic(new Color('#B6B5BA'), new Color('#414144'));
    
    rightStack.addSpacer(18);
    
    // 第二行数据
    const secondRow = rightStack.addStack();
    secondRow.layoutHorizontally();
    secondRow.spacing = 18;
    
    // 套餐类型
    const packageStack = secondRow.addStack();
    packageStack.layoutHorizontally();
    packageStack.centerAlignContent();
    
    const packageBar = packageStack.addImage(this.createValueBar(40, '#FFB347'));
    packageStack.addSpacer(12);
    
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
    
    const statusBar = statusStack.addImage(this.createValueBar(40, '#9C27B0'));
    statusStack.addSpacer(12);
    
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
    
    const statusUnitStack = statusValueStack.addStack();
    statusUnitStack.cornerRadius = 4;
    statusUnitStack.borderWidth = 1;
    statusUnitStack.borderColor = new Color('#9C27B0');
    statusUnitStack.setPadding(1, 3, 1, 3);
    statusUnitStack.backgroundColor = Color.dynamic(new Color('#9C27B0'), new Color('#9C27B0', 0.3));
    
    const statusUnit = statusUnitStack.addText('');
    statusUnit.font = Font.mediumRoundedSystemFont(12);
    statusUnit.textColor = Color.dynamic(Color.white(), new Color('#9C27B0'));
  }

  // 错误状态组件
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

  // UI 主渲染
  async renderWidget() {
    const widget = new ListWidget();
    const family = config.widgetFamily || 'medium';
    const isDark = Device.isUsingDarkAppearance();
  
    const data = await this.fetchBalanceData();
  
    if (data) {
      if (family === 'small') {
        this.renderSmallWidget(widget, data, isDark);
      } else if (family === 'medium') {
        this.renderMediumWidget(widget, data, isDark);
      } else {
        this.renderLargeWidget(widget, data, isDark);
      }
    } else {
      this.renderErrorWidget(widget, isDark);
    }
  
    return widget;
  }

  async render() {
    return await this.renderWidget();
  }

  // 配置菜单
  Run() {
    if (config.runsInApp) {
      this.registerAction({
        title: '宽带余额设置',
        menu: [
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
