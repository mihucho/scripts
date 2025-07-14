// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;
// 电信宽带余额小组件 - 完全仿照国网界面
// 名称: 电信宽带余额国网版
// 作者: YourName
// 版本: 6.0

if (typeof require === 'undefined') require = importModule;
const { DmYY, Runing } = require('./DmYY');

const VERSION = '6.0';
const PROXY_URL = 'https://gh-proxy.com/';

class BroadbandWidget extends DmYY {
	constructor(arg) {
		super(arg);
		this.name = '电信宽带';
		this.en = 'broadband';
		this.index = 0;
		this.data = null;
		this.Run();
	}

	version = VERSION;

	fm = FileManager.local();
	CACHE_FOLDER = Script.name();
	cachePath = null;

	// 电信宽带相关数据
	balance = 0;
	remainingDays = 0;
	monthlyFee = 0;
	packageType = '包月';
	update = this.formatDate();

	// 界面样式控制
	SCALE = 1;
	smallStackColor = '#3A9690';
	endColor = '#3A9690';
	lastColor = '#00CC99';
	widgetStyle = '1';

	size = {
		logo: 48 * 0.95,
		leftStack: 130 * 0.95,
		smallFont: 12 * 0.95,
		bigFont: 18 * 0.95,
		balance: 20 * 0.95,
		subSpacer: 6.5 * 0.95,
	};

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

	// 获取缩放比例 - 完全仿照国网
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

	// 单位 - 完全仿照国网
	unit(stack, text, spacer, corlor = this.widgetColor, overDue = false) {
		stack.addSpacer(1);
		const unitStack = stack.addStack();
		unitStack.layoutVertically();
		unitStack.addSpacer(spacer);
		const unitTitle = unitStack.addText(text);
		unitTitle.font = Font.semiboldRoundedSystemFont(10 * this.SCALE);
		unitTitle.textColor = overDue ? new Color('DE2A18') : corlor;
	}

	// 分栏 - 完全仿照国网
	split(stack, width, height, ver = false) {
		const splitStack = stack.addStack();
		splitStack.size = new Size(width, height);
		if (ver) splitStack.layoutVertically();
		splitStack.addSpacer();
		splitStack.backgroundColor = Color.dynamic(new Color('#B6B5BA'), new Color('#414144'));
	}

	// 标题 - 完全仿照国网
	setTitle(stack, iconColor, nameColor) {
		const nameStack = stack.addStack();
		const iconSFS = SFSymbol.named('wifi');
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
		title.textColor = this.widgetColor;
		title.textOpacity = 0.5;

		const valueStack = leftStack.addStack();
		valueStack.centerAlignContent();
		const value = valueStack.addText(data[1]);
		value.font = Font.semiboldRoundedSystemFont(16 * this.SCALE);
		value.textColor = this.widgetColor;
		valueStack.addSpacer();

		const unitStack = valueStack.addStack();
		unitStack.cornerRadius = 4 * this.SCALE;
		unitStack.borderWidth = 1;
		unitStack.borderColor = new Color(color);
		unitStack.setPadding(1, 3 * this.SCALE, 1, 3 * this.SCALE);
		unitStack.size = new Size(30 * this.SCALE, 0);
		unitStack.backgroundColor = Color.dynamic(new Color(color), new Color(color, 0.3));
		const unit = unitStack.addText(data[2]);
		unit.font = Font.mediumRoundedSystemFont(10 * this.SCALE);
		unit.textColor = Color.dynamic(Color.white(), new Color(color));
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
		balanceText.textColor = this.widgetColor;
		this.unit(balanceStack, "元", spacer * this.SCALE, this.widgetColor);
		balanceStack.addSpacer();
		bodyStack.addSpacer(3 * this.SCALE);

		//  余额标题Stack
		const balanceTitleStack = bodyStack.addStack();
		balanceTitleStack.addSpacer();
		const balanceTitleText = balanceTitleStack.addText(balanceTitle);
		balanceTitleStack.addSpacer();
		bodyStack.addSpacer(padding * this.SCALE);

		balanceTitleText.textColor = this.widgetColor;
		balanceTitleText.font = Font.semiboldSystemFont(titleSize);
		balanceTitleText.textOpacity = 0.5;
	}

	// 获取Logo - 完全仿照国网
	getLogo = async () => {
		const logoUrl = this.settings.logoUrl;
		if (logoUrl) {
			try {
				return await this.getImageByUrl(logoUrl, 'broadband_logo.png');
			} catch (e) {
				console.log('自定义Logo加载失败，使用默认图标');
			}
		}

		// 使用默认WiFi图标
		const icon = SFSymbol.named('wifi').image;
		return icon;
	}

	// 格式化日期 - 完全仿照国网
	formatDate() {
		let theDate = Date.now();
		let dF = new DateFormatter();
		dF.dateFormat = 'yyyy-MM-dd HH:mm:ss';
		theDate = new Date(theDate);
		return dF.string(theDate);
	}

	// 获取时间 - 完全仿照国网
	getTime = () => {
		const dateTime = this.update;
		const parts = dateTime.split(' ');
		const datePart = parts[0].split('-');
		const timePart = parts[1].split(':');
		return `${datePart[1]}-${datePart[2]} ${timePart[0]}:${timePart[1]}`;
	}

	// 图片处理方法 - 完全仿照国网
	getImageByUrl = async (url, cacheKey) => {
		const cacheImg = this.loadImgCache(cacheKey);
		if (cacheImg != undefined && cacheImg != null) {
			console.log(`使用缓存：${cacheKey}`);
			return this.loadImgCache(cacheKey);
		}

		try {
			console.log(`在线请求：${cacheKey}`);
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
			console.log(`使用预设图片`);
			const icon = SFSymbol.named('wifi').image;
			return icon;
		}
	}

	loadImgCache(cacheKey) {
		const cacheFile = this.fm.joinPath(this.cachePath, cacheKey);
		const fileExists = this.fm.fileExists(cacheFile);
		let img = undefined;
		if (fileExists) {
			if (this.settings.useICloud === 'true') this.fm.downloadFileFromiCloud(this.cachePath);
			img = Image.fromFile(cacheFile);
		}
		return img;
	}

	saveImgCache(cacheKey, img) {
		if (!this.fm.fileExists(this.cachePath)) {
			this.fm.createDirectory(this.cachePath, true);
		};
		const cacheFile = this.fm.joinPath(this.cachePath, cacheKey);
		this.fm.writeImage(cacheFile, img);
	}

	// 获取宽带数据 - 仿照国网的getBillData结构
	getBroadbandData = async () => {
		const dataName = '宽带数据';
		try {
			console.log('获取宽带余额数据');
			this.data = await this.fetchBalanceData();

			if (!this.data) throw new Error("请求失败,请检查配置");

			this.balance = parseFloat(this.data.balance || 0);
			this.remainingDays = this.calculateRemainingDays(this.balance);
			this.monthlyFee = this.getMonthlyFee();
			this.packageType = this.settings.packageType || '包月';
			this.update = this.formatDate();

			console.log(`宽带余额: ${this.balance}元, 可用天数: ${this.remainingDays}天`);
		} catch (e) {
			console.log(e);
		}
	}

	// 小组件渲染 - 移除"宽带余额"文本，参考中等样式的单位显示
	renderSmall = async (w) => {
		const padding = 12 * this.SCALE;
		w.setPadding(padding, padding, padding, padding);
		w.backgroundColor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
		const bodyStack = w.addStack();
		bodyStack.layoutVertically();

		// 顶部Logo和标题
		const headerStack = bodyStack.addStack();
		headerStack.centerAlignContent();
		
		let wsgw = headerStack.addImage(await this.getLogo());
		wsgw.imageSize = new Size(24 * this.SCALE, 24 * this.SCALE);
		
		headerStack.addSpacer(8);
		
		const titleStack = headerStack.addStack();
		titleStack.layoutVertically();
		const titleText = titleStack.addText('电信宽带');
		titleText.font = Font.mediumSystemFont(14 * this.SCALE);
		titleText.textColor = this.widgetColor;

		const updateColor = new Color('#2F6E6B');
		const updateStack = titleStack.addStack();
		const updateImg = updateStack.addImage(SFSymbol.named('arrow.2.circlepath').image);
		updateImg.tintColor = updateColor;
		updateImg.imageOpacity = 0.5;
		updateImg.imageSize = new Size(8, 8);
		updateStack.addSpacer(3);
		const updateText = updateStack.addText(this.getTime());
		updateText.font = Font.systemFont(8);
		updateText.textColor = updateColor;
		updateText.textOpacity = 0.5;

		bodyStack.addSpacer();

		// 余额展示区域 - 移除标题文本，参考中等样式的单位显示
		const balanceContainer = bodyStack.addStack();
		balanceContainer.layoutVertically();
		balanceContainer.cornerRadius = 12;
		balanceContainer.backgroundColor = Color.dynamic(new Color(this.settings.leftDayColor || "#F2F2F7"), new Color(this.settings.leftNightColor || "#1C1C1E"));
		balanceContainer.setPadding(12, 12, 12, 12);

		// 直接显示余额和单位，参考中等组件的单位样式
		const balanceValueStack = balanceContainer.addStack();
		balanceValueStack.addSpacer();
		balanceValueStack.centerAlignContent();
		
		const balanceValue = balanceValueStack.addText(`${this.balance}`);
		balanceValue.font = Font.boldRoundedSystemFont(20 * this.SCALE);
		balanceValue.textColor = this.widgetColor;
		balanceValue.minimumScaleFactor = 0.5;
		
		// 使用与中等组件相同的单位显示方式
		this.unit(balanceValueStack, '元', 4 * this.SCALE, this.widgetColor);
		balanceValueStack.addSpacer();

		bodyStack.addSpacer();

		// 底部数据展示
		const dataStack = bodyStack.addStack();
		dataStack.layoutHorizontally();
		dataStack.spacing = 8;

		// 可用天数
		const remainingStack = dataStack.addStack();
		remainingStack.layoutVertically();
		remainingStack.cornerRadius = 8;
		remainingStack.backgroundColor = Color.dynamic(new Color(this.settings.leftDayColor || "#F2F2F7"), new Color(this.settings.leftNightColor || "#1C1C1E"));
		remainingStack.setPadding(8, 8, 8, 8);

		const remainingTitle = remainingStack.addText('可用天数');
		remainingTitle.font = Font.systemFont(9 * this.SCALE);
		remainingTitle.textColor = this.widgetColor;
		remainingTitle.textOpacity = 0.5;
		remainingTitle.centerAlignText();

		remainingStack.addSpacer(2);

		const remainingValueStack = remainingStack.addStack();
		remainingValueStack.addSpacer();
		const remainingValue = remainingValueStack.addText(this.remainingDays.toString());
		remainingValue.font = Font.boldRoundedSystemFont(14 * this.SCALE);
		remainingValue.textColor = this.widgetColor;
		remainingValueStack.addSpacer();

		// 每月费用
		const monthlyStack = dataStack.addStack();
		monthlyStack.layoutVertically();
		monthlyStack.cornerRadius = 8;
		monthlyStack.backgroundColor = Color.dynamic(new Color(this.settings.leftDayColor || "#F2F2F7"), new Color(this.settings.leftNightColor || "#1C1C1E"));
		monthlyStack.setPadding(8, 8, 8, 8);

		const monthlyTitle = monthlyStack.addText('每月费用');
		monthlyTitle.font = Font.systemFont(9 * this.SCALE);
		monthlyTitle.textColor = this.widgetColor;
		monthlyTitle.textOpacity = 0.5;
		monthlyTitle.centerAlignText();

		monthlyStack.addSpacer(2);

		const monthlyValueStack = monthlyStack.addStack();
		monthlyValueStack.addSpacer();
		const monthlyValue = monthlyValueStack.addText(this.monthlyFee);
		monthlyValue.font = Font.boldRoundedSystemFont(14 * this.SCALE);
		monthlyValue.textColor = this.widgetColor;
		monthlyValueStack.addSpacer();

		return w;
	}

	// 中等组件渲染 - 修复右侧垂直居中问题
	renderMedium = async (w) => {
		w.setPadding(0, 0, 0, 0);
		w.backgroundColor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
		const updateColor = new Color('#2F6E6B');
		const bodyStack = w.addStack();

		//  左侧stack
		const leftStack = bodyStack.addStack();
		leftStack.layoutVertically();
		leftStack.setPadding(0, 15, 0, 15);
		leftStack.size = new Size(this.size.leftStack / this.SCALE, 0);
		leftStack.backgroundColor = Color.dynamic(new Color(this.settings.leftDayColor || "#F2F2F7"), new Color(this.settings.leftNightColor || "#1C1C1E"));

		//  标题及LOGO
		leftStack.addSpacer();
		const logoStack = leftStack.addStack();
		logoStack.addSpacer();
		let wsgw = logoStack.addImage(await this.getLogo());
		wsgw.imageSize = new Size(this.size.logo, this.size.logo);
		logoStack.addSpacer();

		leftStack.addSpacer();
		this.setUpdateStack(leftStack, updateColor);
		leftStack.addSpacer(2);

		const balanceStackBgcolor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
		this.balance = this.balance;
		this.setBalanceStack(leftStack, balanceStackBgcolor, 8 * this.SCALE, this.size.balance, this.size.smallFont, 4.5);
		leftStack.addSpacer(15);

		this.split(bodyStack, 0.5, 0, true);

		//  右侧Stack - 修复垂直居中问题
		const rightStack = bodyStack.addStack();
		rightStack.setPadding(15, 15, 15, 15);
		rightStack.layoutVertically();

		// 添加顶部间距以实现垂直居中
		rightStack.addSpacer();

		// 第一行：可用天数 和 每月费用
		const firstRow = rightStack.addStack();
		firstRow.layoutHorizontally();
		firstRow.spacing = 12;

		// 可用天数
		const remainingStack = firstRow.addStack();
		remainingStack.layoutHorizontally();
		remainingStack.centerAlignContent();

		const remainingBar = remainingStack.addStack();
		remainingBar.size = new Size(8 * this.SCALE, 30 * this.SCALE);
		remainingBar.cornerRadius = 4 * this.SCALE;
		remainingBar.backgroundColor = new Color('#4CAF50');

		remainingStack.addSpacer(10 * this.SCALE);

		const remainingContent = remainingStack.addStack();
		remainingContent.layoutVertically();
		remainingContent.addSpacer(2 * this.SCALE);

		const remainingTitle = remainingContent.addText('可用天数');
		remainingTitle.font = Font.systemFont(10 * this.SCALE);
		remainingTitle.textColor = this.widgetColor;
		remainingTitle.textOpacity = 0.5;

		const remainingValueStack = remainingContent.addStack();
		remainingValueStack.centerAlignContent();

		const remainingValue = remainingValueStack.addText(this.remainingDays.toString());
		remainingValue.font = Font.boldRoundedSystemFont(16 * this.SCALE);
		remainingValue.textColor = this.widgetColor;

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

		const monthlyBar = monthlyStack.addStack();
		monthlyBar.size = new Size(8 * this.SCALE, 30 * this.SCALE);
		monthlyBar.cornerRadius = 4 * this.SCALE;
		monthlyBar.backgroundColor = new Color('#2196F3');

		monthlyStack.addSpacer(10 * this.SCALE);

		const monthlyContent = monthlyStack.addStack();
		monthlyContent.layoutVertically();
		monthlyContent.addSpacer(2 * this.SCALE);

		const monthlyTitle = monthlyContent.addText('每月费用');
		monthlyTitle.font = Font.systemFont(10 * this.SCALE);
		monthlyTitle.textColor = this.widgetColor;
		monthlyTitle.textOpacity = 0.5;
		monthlyTitle.centerAlignText();

		const monthlyValueStack = monthlyContent.addStack();
		monthlyValueStack.centerAlignContent();

		const monthlyValue = monthlyValueStack.addText(this.monthlyFee);
		monthlyValue.font = Font.boldRoundedSystemFont(16 * this.SCALE);
		monthlyValue.textColor = this.widgetColor;

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

		// 行间距
		rightStack.addSpacer(15);
		this.split(rightStack, 0, 0.5 * this.SCALE);
		rightStack.addSpacer(15);

		// 第二行：套餐类型 和 状态
		const secondRow = rightStack.addStack();
		secondRow.layoutHorizontally();
		secondRow.spacing = 12;

		// 套餐类型
		const packageStack = secondRow.addStack();
		packageStack.layoutHorizontally();
		packageStack.centerAlignContent();

		const packageBar = packageStack.addStack();
		packageBar.size = new Size(8 * this.SCALE, 30 * this.SCALE);
		packageBar.cornerRadius = 4 * this.SCALE;
		packageBar.backgroundColor = new Color('#FFB347');

		packageStack.addSpacer(10 * this.SCALE);

		const packageContent = packageStack.addStack();
		packageContent.layoutVertically();
		packageContent.addSpacer(2 * this.SCALE);

		const packageTitle = packageContent.addText('套餐类型');
		packageTitle.font = Font.systemFont(10 * this.SCALE);
		packageTitle.textColor = this.widgetColor;
		packageTitle.textOpacity = 0.5;

		const packageValueStack = packageContent.addStack();
		packageValueStack.centerAlignContent();

		const packageValue = packageValueStack.addText(this.packageType);
		packageValue.font = Font.boldRoundedSystemFont(16 * this.SCALE);
		packageValue.textColor = this.widgetColor;

		packageValueStack.addSpacer();

		// 状态
		const statusStack = secondRow.addStack();
		statusStack.layoutHorizontally();
		statusStack.centerAlignContent();

		const statusBar = statusStack.addStack();
		statusBar.size = new Size(8 * this.SCALE, 30 * this.SCALE);
		statusBar.cornerRadius = 4 * this.SCALE;
		statusBar.backgroundColor = new Color('#9C27B0');

		statusStack.addSpacer(10 * this.SCALE);

		const statusContent = statusStack.addStack();
		statusContent.layoutVertically();
		statusContent.addSpacer(2 * this.SCALE);

		const statusTitle = statusContent.addText('余额状态');
		statusTitle.font = Font.systemFont(10 * this.SCALE);
		statusTitle.textColor = this.widgetColor;
		statusTitle.textOpacity = 0.5;

		const statusValueStack = statusContent.addStack();
		statusValueStack.centerAlignContent();

		const statusText = this.balance > 30 ? '正常' : this.balance > 10 ? '偏低' : '不足';
		const statusValue = statusValueStack.addText(statusText);
		statusValue.font = Font.boldRoundedSystemFont(16 * this.SCALE);
		statusValue.textColor = this.widgetColor;

		statusValueStack.addSpacer();

		// 添加底部间距以实现垂直居中
		rightStack.addSpacer();

		return w;
	}

	// 大组件渲染 - 修复余额颜色和指示条对齐问题
	renderLarge = async (w) => {
		w.setPadding(16, 16, 16, 16);
		w.backgroundColor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
		
		const mainStack = w.addStack();
		mainStack.layoutVertically();

		// 顶部区域：Logo、标题和更新时间
		const headerStack = mainStack.addStack();
		headerStack.layoutHorizontally();
		headerStack.centerAlignContent();

		// Logo
		let wsgw = headerStack.addImage(await this.getLogo());
		wsgw.imageSize = new Size(32 * this.SCALE, 32 * this.SCALE);

		headerStack.addSpacer(12);

		// 标题和更新时间
		const titleContainer = headerStack.addStack();
		titleContainer.layoutVertically();
		
		const titleText = titleContainer.addText('电信宽带');
		titleText.font = Font.mediumSystemFont(18 * this.SCALE);
		titleText.textColor = this.widgetColor;

		const updateColor = new Color('#2F6E6B');
		const updateStack = titleContainer.addStack();
		const updateImg = updateStack.addImage(SFSymbol.named('arrow.2.circlepath').image);
		updateImg.tintColor = updateColor;
		updateImg.imageOpacity = 0.5;
		updateImg.imageSize = new Size(12, 12);
		updateStack.addSpacer(3);
		const updateText = updateStack.addText(this.getTime());
		updateText.font = Font.systemFont(12);
		updateText.textColor = updateColor;
		updateText.textOpacity = 0.5;

		headerStack.addSpacer();

		mainStack.addSpacer(12);

		// 余额展示区域 - 修复颜色问题
		const balanceContainer = mainStack.addStack();
		balanceContainer.layoutVertically();
		balanceContainer.cornerRadius = 16;
		balanceContainer.backgroundColor = Color.dynamic(new Color(this.settings.leftDayColor || "#F2F2F7"), new Color(this.settings.leftNightColor || "#1C1C1E"));
		balanceContainer.setPadding(20, 20, 20, 20);

		const balanceHeader = balanceContainer.addStack();
		const balanceLabel = balanceHeader.addText('宽带余额');
		balanceLabel.font = Font.mediumSystemFont(16);
		balanceLabel.textColor = Color.dynamic(new Color('#666666'), new Color('#AAAAAA'));

		balanceHeader.addSpacer();

		const currencySymbol = balanceHeader.addText('¥');
		currencySymbol.font = Font.boldSystemFont(20);
		currencySymbol.textColor = this.widgetColor;

		balanceContainer.addSpacer(12);

		const balanceValue = balanceContainer.addText(`${this.balance}`);
		balanceValue.font = Font.boldSystemFont(42);
		balanceValue.textColor = this.widgetColor; // 改为默认颜色
		balanceValue.centerAlignText();

		mainStack.addSpacer(12);

		// 数据展示区域 - 修复指示条对齐问题
		const dataContainer = mainStack.addStack();
		dataContainer.layoutVertically();
		dataContainer.cornerRadius = 16;
		dataContainer.backgroundColor = Color.dynamic(new Color(this.settings.leftDayColor || "#F2F2F7"), new Color(this.settings.leftNightColor || "#1C1C1E"));
		dataContainer.setPadding(20, 20, 20, 20);

		// 第一行
		const firstRow = dataContainer.addStack();
		firstRow.layoutHorizontally();
		firstRow.spacing = 20;

		// 可用天数
		this.createDataItem(firstRow, '可用天数', this.remainingDays.toString(), '天', '#4CAF50');

		// 每月费用
		this.createDataItem(firstRow, '每月费用', this.monthlyFee, '元', '#2196F3');

		dataContainer.addSpacer(20);

		// 第二行
		const secondRow = dataContainer.addStack();
		secondRow.layoutHorizontally();
		secondRow.spacing = 20;

		// 套餐类型
		this.createDataItem(secondRow, '套餐类型', this.packageType, '', '#FFB347');

		// 余额状态
		const statusText = this.balance > 30 ? '正常' : this.balance > 10 ? '偏低' : '不足';
		this.createDataItem(secondRow, '余额状态', statusText, '', '#9C27B0');

		return w;
	}

	// 修复数据项对齐问题
	createDataItem(parentStack, title, value, unit, color) {
		const itemStack = parentStack.addStack();
		itemStack.layoutVertically();
		itemStack.spacing = 8;

		const titleText = itemStack.addText(title);
		titleText.font = Font.systemFont(12 * this.SCALE);
		titleText.textColor = this.widgetColor;
		titleText.textOpacity = 0.7;
		titleText.centerAlignText();

		const valueContainer = itemStack.addStack();
		// 修复对齐问题：不使用addSpacer()开头，让彩色指示条与标题对齐

		// 彩色指示条
		const colorBar = valueContainer.addStack();
		colorBar.size = new Size(4 * this.SCALE, 20 * this.SCALE);
		colorBar.cornerRadius = 2 * this.SCALE;
		colorBar.backgroundColor = new Color(color);

		valueContainer.addSpacer(8);

		const valueStack = valueContainer.addStack();
		const valueText = valueStack.addText(value);
		valueText.font = Font.boldRoundedSystemFont(18 * this.SCALE);
		valueText.textColor = this.widgetColor;

		if (unit) {
			valueStack.addSpacer(4);
			const unitText = valueStack.addText(unit);
			unitText.font = Font.systemFont(12 * this.SCALE);
			unitText.textColor = this.widgetColor;
			unitText.textOpacity = 0.7;
		}

		valueContainer.addSpacer();
	}

	// 初始化 - 完全仿照国网init
	init = async () => {
		try {
			if (this.settings.useICloud === 'true') this.fm = FileManager.iCloud();
			this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), this.CACHE_FOLDER);

			const scale = this.getWidgetScaleFactor();
			this.SCALE = this.settings.SCALE || scale;

			Object.keys(this.size).forEach(key => {
				this.size[key] = this.settings[key] ? this.settings[key] : this.size[key];
				this.size[key] = this.size[key] * this.SCALE;
			});

			this.updateIndex();
		} catch (e) {
			console.log(e);
		}
		await this.getBroadbandData();
	}

	// 更新索引 - 仿照国网updateIndex
	updateIndex() {
		const i = args.widgetParameter;
		if (i == 0 || !i || i == null) {
			this.name = this.settings.name || '电信宽带';
			this.smallStackColor = this.settings.smallStackColor || this.smallStackColor;
			this.widgetStyle = this.settings.widgetStyle || this.widgetStyle;
			this.endColor = this.settings.endColor || this.endColor;
			return;
		}
	}

	// 脚本更新检查 - 完全仿照国网
	async checkAndUpdateScript() {
		const downloadUrl = "https://raw.githubusercontent.com/mihucho/scripts/refs/heads/main/DDKD/kuandai.js";
		const scriptName = this.CACHE_FOLDER + '.js';
		try {
			const alert = new Alert();
			alert.title = "是否更新脚本？";
			alert.message = `更新脚本将覆盖现有内容！`;
			alert.addAction("更新");
			alert.addCancelAction("取消");

			const response = await alert.presentAlert();
			if (response === 0) {
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
			}

		} catch (e) {
			const errorAlert = new Alert();
			errorAlert.title = "检查更新失败";
			errorAlert.message = "无法连接到更新服务器。";
			errorAlert.addAction("确定");
			await errorAlert.present();
		}
	}

	// 主渲染方法 - 完全仿照国网render
	async render() {
		await this.init();
		const widget = new ListWidget();
		await this.getWidgetBackgroundImage(widget);

		if (this.widgetFamily === 'medium') {
			return await this.renderMedium(widget);
		} else if (this.widgetFamily === 'large') {
			return await this.renderLarge(widget);
		} else {
			return await this.renderSmall(widget);
		}
	}

	// 配置菜单 - 去除指定的配置项
	Run() {
		if (config.runsInApp) {
			this.registerAction({
				title: '组件配置',
				menu: [
					{
						url: PROXY_URL + 'https://raw.githubusercontent.com/mihucho/scripts/main/DDKD/useICloud.png',
						type: 'switch',
						title: 'iCloud',
						val: 'useICloud',
					},
					{
						url: PROXY_URL + 'https://raw.githubusercontent.com/mihucho/scripts/main/DDKD/update.png',
						type: 'input',
						title: '脚本更新',
						name: 'update',
						onClick: async () => {
							await this.checkAndUpdateScript();
						},
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
				],
			});

			// 移除第二个配置页面（包含Logo、标题、样式、颜色等配置）

			this.registerAction({
				title: '',
				menu: [
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
						url: PROXY_URL + 'https://raw.githubusercontent.com/mihucho/scripts/main/DDKD/reset.png',
						title: '清除缓存',
						desc: '',
						val: 'reset',
						onClick: async () => {
							const options = ['取消', '确认清除'];
							const message = '所有缓存数据将会被清空';
							const index = await this.generateAlert(message, options);
							if (index === 0) return;
							this.fm.remove(this.cachePath);
						},
					},
					{
						name: 'reload',
						url: PROXY_URL + 'https://raw.githubusercontent.com/mihucho/scripts/main/DDKD/reload.png',
						title: '重载组件',
						type: 'input',
						onClick: () => {
							this.reopenScript();
						},
					},
				],
			});
		}
	}
}

await Runing(BroadbandWidget, args.widgetParameter, false);
