// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;
// 电信宽带余额小组件 - 国网平铺式布局
// 名称: 电信宽带余额国网版
// 作者: YourName
// 版本: 5.0

if (typeof require === 'undefined') require = importModule;
const { DmYY, Runing } = require('./DmYY');

class BroadbandWidget extends DmYY {
  constructor(arg) {
    super(arg);
    this.name = '电信宽带';
    this.en = 'broadband';
    this.version = '5.0';
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

  // 获取每日费用
  getDailyCost() {
    const packageType = this.settings.packageType || '包月';
    const packageFee = parseFloat(this.settings.packageFee || 0);
    
    if (packageFee <= 0) return 0;
    
    if (packageType === '包月') {
      return (packageFee / 30).toFixed(2);
    } else if (packageType === '包年') {
      return (packageFee / 365).toFixed(2);
    }
    
    return 0;
  }

  // 获取剩余天数状态颜色
  getRemainingDaysColor(days) {
    if (days < 3) {
      return new Color('#FF4444');
    } else if (days < 7) {
      return new Color('#FF8800');
    } else if (days < 30) {
      return new Color('#4CAF50');
    } else {
      return new Color('#2196F3');
    }
  }

  // 获取余额状态颜色
  getBalanceColor(balance) {
    if (balance < 10) {
      return new Color('#FF4444');
    } else if (balance < 30) {
      return new Color('#FF8800');
    } else if (balance < 100) {
      return new Color('#4CAF50');
    } else {
      return new Color('#2196F3');
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

  // 创建渐变背景
  createGradientBackground(isDark = false) {
    const gradient = new LinearGradient();
    if (isDark) {
      gradient.colors = [
        new Color('#E2E2E7', 1),
        new Color('#F0F0F0', 1)
      ];
    } else {
      gradient.colors = [
        new Color('#E2E2E7', 1),
        new Color('#F0F0F0', 1)
      ];
    }
    gradient.locations = [0, 1];
    return gradient;
  }

  // 获取文字颜色
  getTextColor(isDark = false) {
    return new Color('#333333', 1);
  }

  // 获取次要文字颜色
  getSecondaryTextColor(isDark = false) {
    return new Color('#666666', 1);
  }

  // 获取淡化文字颜色
  getTertiaryTextColor(isDark = false) {
    return new Color('#999999', 1);
  }

  // 创建数值显示条 - 仿照国网样式
  createValueBar(value, unit, color, height = 30) {
    const context = new DrawContext();
    context.size = new Size(8, height);
    context.opaque = false;
    context.respectScreenScale = true;
    
    // 绘制彩色条
    context.setFillColor(color);
    context.fillRect(new Rect(0, 0, 8, height));
    
    return context.getImage();
  }

  // 小组件布局 - 完全仿照国网样式
  renderSmallWidget(widget, data, isDark) {
    const balance = parseFloat(data.balance || 0);
    const remainingDays = this.calculateRemainingDays(balance);
    const dailyCost = this.getDailyCost();
    
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
    timeText.font = Font.mediumSystemFont(10);
    timeText.textColor = this.getSecondaryTextColor(isDark);
    timeStack.addSpacer();
    
    widget.addSpacer(15);
    
    // 主要余额显示 - 左侧大数字
    const balanceStack = widget.addStack();
    balanceStack.layoutVertically();
    
    const balanceValue = balanceStack.addText(data.balance);
    balanceValue.font = Font.boldSystemFont(45);
    balanceValue.textColor = this.getBalanceColor(balance);
    balanceValue.minimumScaleFactor = 0.8;
    
    const balanceLabel = balanceStack.addText('宽带余额');
    balanceLabel.font = Font.mediumSystemFont(12);
    balanceLabel.textColor = this.getSecondaryTextColor(isDark);
    
    widget.addSpacer(20);
    
    // 底部数据行 - 仿照国网的数据展示
    const dataStack = widget.addStack();
    dataStack.layoutVertically();
    dataStack.spacing = 8;
    
    // 剩余天数行
    const remainingRow = dataStack.addStack();
    remainingRow.layoutHorizontally();
    remainingRow.centerAlignContent();
    
    const remainingBar = remainingRow.addImage(this.createValueBar(remainingDays, '天', this.getRemainingDaysColor(remainingDays)));
    remainingRow.addSpacer(10);
    
    const remainingContent = remainingRow.addStack();
    remainingContent.layoutVertically();
    
    const remainingTitle = remainingContent.addText('剩余天数');
    remainingTitle.font = Font.mediumSystemFont(10);
    remainingTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const remainingValueStack = remainingContent.addStack();
    remainingValueStack.centerAlignContent();
    
    const remainingValueText = remainingValueStack.addText(remainingDays.toString());
    remainingValueText.font = Font.boldSystemFont(16);
    remainingValueText.textColor = this.getTextColor(isDark);
    
    remainingValueStack.addSpacer(4);
    
    const remainingUnit = remainingValueStack.addText('天');
    remainingUnit.font = Font.mediumSystemFont(10);
    remainingUnit.textColor = this.getSecondaryTextColor(isDark);
    
    // 每日费用行
    const dailyRow = dataStack.addStack();
    dailyRow.layoutHorizontally();
    dailyRow.centerAlignContent();
    
    const dailyBar = dailyRow.addImage(this.createValueBar(dailyCost, '元', this.getSecondaryTextColor(isDark)));
    dailyRow.addSpacer(10);
    
    const dailyContent = dailyRow.addStack();
    dailyContent.layoutVertically();
    
    const dailyTitle = dailyContent.addText('每日费用');
    dailyTitle.font = Font.mediumSystemFont(10);
    dailyTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const dailyValueStack = dailyContent.addStack();
    dailyValueStack.centerAlignContent();
    
    const dailyValueText = dailyValueStack.addText(dailyCost);
    dailyValueText.font = Font.boldSystemFont(16);
    dailyValueText.textColor = this.getTextColor(isDark);
    
    dailyValueStack.addSpacer(4);
    
    const dailyUnit = dailyValueStack.addText('元');
    dailyUnit.font = Font.mediumSystemFont(10);
    dailyUnit.textColor = this.getSecondaryTextColor(isDark);
  }

  // 中等组件布局 - 完全仿照国网样式
  renderMediumWidget(widget, data, isDark) {
    const balance = parseFloat(data.balance || 0);
    const remainingDays = this.calculateRemainingDays(balance);
    const dailyCost = this.getDailyCost();
    
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
    timeText.font = Font.mediumSystemFont(10);
    timeText.textColor = this.getSecondaryTextColor(isDark);
    timeStack.addSpacer();
    
    widget.addSpacer(20);
    
    // 主要内容区域 - 仿照国网的左右布局
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.spacing = 20;
    
    // 左侧 - 余额显示
    const leftStack = mainStack.addStack();
    leftStack.layoutVertically();
    leftStack.size = new Size(140, 0);
    
    const balanceValue = leftStack.addText(data.balance);
    balanceValue.font = Font.boldSystemFont(48);
    balanceValue.textColor = this.getBalanceColor(balance);
    balanceValue.minimumScaleFactor = 0.8;
    
    leftStack.addSpacer(4);
    
    const balanceLabel = leftStack.addText('宽带余额');
    balanceLabel.font = Font.mediumSystemFont(12);
    balanceLabel.textColor = this.getSecondaryTextColor(isDark);
    
    // 右侧 - 数据展示区域，仿照国网的2x2布局
    const rightStack = mainStack.addStack();
    rightStack.layoutVertically();
    rightStack.spacing = 12;
    
    // 第一行数据
    const firstRow = rightStack.addStack();
    firstRow.layoutHorizontally();
    firstRow.spacing = 12;
    
    // 年度费用
    const yearFeeStack = firstRow.addStack();
    yearFeeStack.layoutHorizontally();
    yearFeeStack.centerAlignContent();
    
    const yearFeeBar = yearFeeStack.addImage(this.createValueBar(0, '元', new Color('#4CAF50')));
    yearFeeStack.addSpacer(10);
    
    const yearFeeContent = yearFeeStack.addStack();
    yearFeeContent.layoutVertically();
    
    const yearFeeTitle = yearFeeContent.addText('年度费用');
    yearFeeTitle.font = Font.mediumSystemFont(10);
    yearFeeTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const yearFeeValueStack = yearFeeContent.addStack();
    yearFeeValueStack.centerAlignContent();
    
    const yearFeeValue = yearFeeValueStack.addText((dailyCost * 365).toFixed(0));
    yearFeeValue.font = Font.boldSystemFont(16);
    yearFeeValue.textColor = this.getTextColor(isDark);
    
    yearFeeValueStack.addSpacer(4);
    
    const yearFeeUnit = yearFeeValueStack.addText('元');
    yearFeeUnit.font = Font.mediumSystemFont(10);
    yearFeeUnit.textColor = this.getSecondaryTextColor(isDark);
    
    // 年度使用天数
    const yearDaysStack = firstRow.addStack();
    yearDaysStack.layoutHorizontally();
    yearDaysStack.centerAlignContent();
    
    const yearDaysBar = yearDaysStack.addImage(this.createValueBar(0, '天', new Color('#2196F3')));
    yearDaysStack.addSpacer(10);
    
    const yearDaysContent = yearDaysStack.addStack();
    yearDaysContent.layoutVertically();
    
    const yearDaysTitle = yearDaysContent.addText('年度使用');
    yearDaysTitle.font = Font.mediumSystemFont(10);
    yearDaysTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const yearDaysValueStack = yearDaysContent.addStack();
    yearDaysValueStack.centerAlignContent();
    
    const yearDaysValue = yearDaysValueStack.addText('365');
    yearDaysValue.font = Font.boldSystemFont(16);
    yearDaysValue.textColor = this.getTextColor(isDark);
    
    yearDaysValueStack.addSpacer(4);
    
    const yearDaysUnit = yearDaysValueStack.addText('天');
    yearDaysUnit.font = Font.mediumSystemFont(10);
    yearDaysUnit.textColor = this.getSecondaryTextColor(isDark);
    
    // 第二行数据
    const secondRow = rightStack.addStack();
    secondRow.layoutHorizontally();
    secondRow.spacing = 12;
    
    // 剩余天数
    const remainingStack = secondRow.addStack();
    remainingStack.layoutHorizontally();
    remainingStack.centerAlignContent();
    
    const remainingBar = remainingStack.addImage(this.createValueBar(remainingDays, '天', this.getRemainingDaysColor(remainingDays)));
    remainingStack.addSpacer(10);
    
    const remainingContent = remainingStack.addStack();
    remainingContent.layoutVertically();
    
    const remainingTitle = remainingContent.addText('剩余天数');
    remainingTitle.font = Font.mediumSystemFont(10);
    remainingTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const remainingValueStack = remainingContent.addStack();
    remainingValueStack.centerAlignContent();
    
    const remainingValueText = remainingValueStack.addText(remainingDays.toString());
    remainingValueText.font = Font.boldSystemFont(16);
    remainingValueText.textColor = this.getTextColor(isDark);
    
    remainingValueStack.addSpacer(4);
    
    const remainingUnit = remainingValueStack.addText('天');
    remainingUnit.font = Font.mediumSystemFont(10);
    remainingUnit.textColor = this.getSecondaryTextColor(isDark);
    
    // 每日费用
    const dailyStack = secondRow.addStack();
    dailyStack.layoutHorizontally();
    dailyStack.centerAlignContent();
    
    const dailyBar = dailyStack.addImage(this.createValueBar(dailyCost, '元', this.getSecondaryTextColor(isDark)));
    dailyStack.addSpacer(10);
    
    const dailyContent = dailyStack.addStack();
    dailyContent.layoutVertically();
    
    const dailyTitle = dailyContent.addText('每日费用');
    dailyTitle.font = Font.mediumSystemFont(10);
    dailyTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const dailyValueStack = dailyContent.addStack();
    dailyValueStack.centerAlignContent();
    
    const dailyValueText = dailyValueStack.addText(dailyCost);
    dailyValueText.font = Font.boldSystemFont(16);
    dailyValueText.textColor = this.getTextColor(isDark);
    
    dailyValueStack.addSpacer(4);
    
    const dailyUnit = dailyValueStack.addText('元');
    dailyUnit.font = Font.mediumSystemFont(10);
    dailyUnit.textColor = this.getSecondaryTextColor(isDark);
  }

  // 大组件布局 - 完全仿照国网样式
  renderLargeWidget(widget, data, isDark) {
    const balance = parseFloat(data.balance || 0);
    const remainingDays = this.calculateRemainingDays(balance);
    const dailyCost = this.getDailyCost();
    
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
    timeText.font = Font.mediumSystemFont(10);
    timeText.textColor = this.getSecondaryTextColor(isDark);
    timeStack.addSpacer();
    
    widget.addSpacer(25);
    
    // 主要内容区域
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.spacing = 25;
    
    // 左侧 - 余额显示
    const leftStack = mainStack.addStack();
    leftStack.layoutVertically();
    leftStack.size = new Size(160, 0);
    
    const balanceValue = leftStack.addText(data.balance);
    balanceValue.font = Font.boldSystemFont(60);
    balanceValue.textColor = this.getBalanceColor(balance);
    balanceValue.minimumScaleFactor = 0.8;
    
    leftStack.addSpacer(8);
    
    const balanceLabel = leftStack.addText('宽带余额');
    balanceLabel.font = Font.mediumSystemFont(14);
    balanceLabel.textColor = this.getSecondaryTextColor(isDark);
    
    // 右侧 - 数据展示区域，仿照国网的2x2布局
    const rightStack = mainStack.addStack();
    rightStack.layoutVertically();
    rightStack.spacing = 18;
    
    // 第一行数据
    const firstRow = rightStack.addStack();
    firstRow.layoutHorizontally();
    firstRow.spacing = 18;
    
    // 年度费用
    const yearFeeStack = firstRow.addStack();
    yearFeeStack.layoutHorizontally();
    yearFeeStack.centerAlignContent();
    
    const yearFeeBar = yearFeeStack.addImage(this.createValueBar(0, '元', new Color('#4CAF50'), 40));
    yearFeeStack.addSpacer(12);
    
    const yearFeeContent = yearFeeStack.addStack();
    yearFeeContent.layoutVertically();
    
    const yearFeeTitle = yearFeeContent.addText('年度费用');
    yearFeeTitle.font = Font.mediumSystemFont(12);
    yearFeeTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const yearFeeValueStack = yearFeeContent.addStack();
    yearFeeValueStack.centerAlignContent();
    
    const yearFeeValue = yearFeeValueStack.addText((dailyCost * 365).toFixed(0));
    yearFeeValue.font = Font.boldSystemFont(20);
    yearFeeValue.textColor = this.getTextColor(isDark);
    
    yearFeeValueStack.addSpacer(6);
    
    const yearFeeUnit = yearFeeValueStack.addText('元');
    yearFeeUnit.font = Font.mediumSystemFont(12);
    yearFeeUnit.textColor = this.getSecondaryTextColor(isDark);
    
    // 年度使用天数
    const yearDaysStack = firstRow.addStack();
    yearDaysStack.layoutHorizontally();
    yearDaysStack.centerAlignContent();
    
    const yearDaysBar = yearDaysStack.addImage(this.createValueBar(0, '天', new Color('#2196F3'), 40));
    yearDaysStack.addSpacer(12);
    
    const yearDaysContent = yearDaysStack.addStack();
    yearDaysContent.layoutVertically();
    
    const yearDaysTitle = yearDaysContent.addText('年度使用');
    yearDaysTitle.font = Font.mediumSystemFont(12);
    yearDaysTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const yearDaysValueStack = yearDaysContent.addStack();
    yearDaysValueStack.centerAlignContent();
    
    const yearDaysValue = yearDaysValueStack.addText('365');
    yearDaysValue.font = Font.boldSystemFont(20);
    yearDaysValue.textColor = this.getTextColor(isDark);
    
    yearDaysValueStack.addSpacer(6);
    
    const yearDaysUnit = yearDaysValueStack.addText('天');
    yearDaysUnit.font = Font.mediumSystemFont(12);
    yearDaysUnit.textColor = this.getSecondaryTextColor(isDark);
    
    // 第二行数据
    const secondRow = rightStack.addStack();
    secondRow.layoutHorizontally();
    secondRow.spacing = 18;
    
    // 剩余天数
    const remainingStack = secondRow.addStack();
    remainingStack.layoutHorizontally();
    remainingStack.centerAlignContent();
    
    const remainingBar = remainingStack.addImage(this.createValueBar(remainingDays, '天', this.getRemainingDaysColor(remainingDays), 40));
    remainingStack.addSpacer(12);
    
    const remainingContent = remainingStack.addStack();
    remainingContent.layoutVertically();
    
    const remainingTitle = remainingContent.addText('剩余天数');
    remainingTitle.font = Font.mediumSystemFont(12);
    remainingTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const remainingValueStack = remainingContent.addStack();
    remainingValueStack.centerAlignContent();
    
    const remainingValueText = remainingValueStack.addText(remainingDays.toString());
    remainingValueText.font = Font.boldSystemFont(20);
    remainingValueText.textColor = this.getTextColor(isDark);
    
    remainingValueStack.addSpacer(6);
    
    const remainingUnit = remainingValueStack.addText('天');
    remainingUnit.font = Font.mediumSystemFont(12);
    remainingUnit.textColor = this.getSecondaryTextColor(isDark);
    
    // 每日费用
    const dailyStack = secondRow.addStack();
    dailyStack.layoutHorizontally();
    dailyStack.centerAlignContent();
    
    const dailyBar = dailyStack.addImage(this.createValueBar(dailyCost, '元', this.getSecondaryTextColor(isDark), 40));
    dailyStack.addSpacer(12);
    
    const dailyContent = dailyStack.addStack();
    dailyContent.layoutVertically();
    
    const dailyTitle = dailyContent.addText('每日费用');
    dailyTitle.font = Font.mediumSystemFont(12);
    dailyTitle.textColor = this.getSecondaryTextColor(isDark);
    
    const dailyValueStack = dailyContent.addStack();
    dailyValueStack.centerAlignContent();
    
    const dailyValueText = dailyValueStack.addText(dailyCost);
    dailyValueText.font = Font.boldSystemFont(20);
    dailyValueText.textColor = this.getTextColor(isDark);
    
    dailyValueStack.addSpacer(6);
    
    const dailyUnit = dailyValueStack.addText('元');
    dailyUnit.font = Font.mediumSystemFont(12);
    dailyUnit.textColor = this.getSecondaryTextColor(isDark);
  }

  // 错误状态组件
  renderErrorWidget(widget, isDark) {
    const errorContainer = widget.addStack();
    errorContainer.layoutVertically();
    errorContainer.centerAlignContent();
    
    const errorIcon = errorContainer.addText('⚠️');
    errorIcon.font = Font.systemFont(32);
    errorContainer.addSpacer(10);
    
    const errorTitle = errorContainer.addText('连接失败');
    errorTitle.font = Font.boldSystemFont(18);
    errorTitle.textColor = this.getTextColor(isDark);
    errorTitle.centerAlignText();
    
    errorContainer.addSpacer(6);
    
    const errorDesc = errorContainer.addText('请检查网络连接或配置信息');
    errorDesc.font = Font.mediumSystemFont(13);
    errorDesc.textColor = this.getSecondaryTextColor(isDark);
    errorDesc.centerAlignText();
    
    errorContainer.addSpacer(8);
    
    const retryHint = errorContainer.addText('点击重试');
    retryHint.font = Font.mediumSystemFont(11);
    retryHint.textColor = this.getSecondaryTextColor(isDark);
    retryHint.centerAlignText();
    
    widget.url = 'scriptable:///run?scriptName=' + Script.name();
  }

  // UI 主渲染
  async renderWidget() {
    const widget = new ListWidget();
    const family = config.widgetFamily || 'medium';
    const isDark = Device.isUsingDarkAppearance();
  
    // 设置渐变背景 - 使用浅色背景仿照国网
    widget.backgroundGradient = this.createGradientBackground(isDark);
  
    // 设置间距
    const padding = 16;
    widget.setPadding(padding, padding, padding, padding);
  
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
                  const dailyCost = this.getDailyCost();
                  alert.title = '连接成功';
                  alert.message = `余额: ¥${data.balance}\n剩余天数: ${remainingDays}天\n每日费用: ${dailyCost}元`;
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
