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

	// 小组件样式1 - 完全仿照国网setWidgetStyle_1
	async setWidgetStyle_1(stack) {
		//  余额
		const headerStack = stack.addStack();
		const hlStack = headerStack.addStack();
		hlStack.layoutVertically();

		const titleStack = hlStack.addStack();
		titleStack.layoutVertically();
		const title = titleStack.addText('宽带余额');
		const balanceStack = hlStack.addStack();
		const balanceText = balanceStack.addText(`${this.balance}`);
		this.unit(balanceStack, '元', 11.5 * this.SCALE, this.widgetColor);

		title.font = Font.systemFont(12 * this.SCALE);
		title.textOpacity = 0.7;
		balanceText.font = Font.boldRoundedSystemFont(23 * this.SCALE);
		balanceText.minimumScaleFactor = 0.5;
		[title, balanceText].map(t => {
			t.textColor = this.widgetColor;
		});

		headerStack.addSpacer();
		let wsgw = headerStack.addImage(await this.getLogo());
		wsgw.imageSize = new Size(26 * this.SCALE, 26 * this.SCALE);
		if (this.smallStackColor !== '#3A9690') wsgw.tintColor = new Color(this.smallStackColor);

		stack.addSpacer();

		// 底部数据
		this.setList(stack, ['可用天数', this.remainingDays.toString(), '天'], '#4CAF50');
		stack.addSpacer();
		this.setList(stack, ['每月费用', this.monthlyFee, '元'], '#2196F3');
	}

	// 小组件样式2 - 完全仿照国网setWidgetStyle_2
	async setWidgetStyle_2(stack) {
		const bodyStack = stack.addStack();
		bodyStack.cornerRadius = 14 * this.SCALE;
		bodyStack.layoutVertically();
		const headerStack = bodyStack.addStack();
		headerStack.setPadding(8 * this.SCALE, 12 * this.SCALE, 0, 12 * this.SCALE);
		headerStack.layoutVertically();

		const title = headerStack.addText('宽带余额');
		title.font = Font.systemFont(12 * this.SCALE);
		title.textColor = this.widgetColor;
		title.textOpacity = 0.7;

		const balanceStack = headerStack.addStack();
		const balanceText = balanceStack.addText(`${this.balance}`);
		balanceText.minimumScaleFactor = 0.5;
		balanceText.font = Font.boldRoundedSystemFont(22 * this.SCALE);
		const color = this.widgetColor;
		balanceText.textColor = color;
		this.unit(balanceStack, '元', 6 * this.SCALE, color);
		balanceStack.addSpacer();
		balanceStack.centerAlignContent();

		const logoImage = balanceStack.addImage(await this.getLogo());
		logoImage.imageSize = new Size(24 * this.SCALE, 24 * this.SCALE);

		bodyStack.addSpacer();
		const mainStack = bodyStack.addStack();
		mainStack.setPadding(8 * this.SCALE, 12 * this.SCALE, 8 * this.SCALE, 12 * this.SCALE);
		mainStack.cornerRadius = 14 * this.SCALE;
		mainStack.backgroundColor = Color.dynamic(new Color("#E2E2E7", 0.3), new Color("#2C2F2F", 1));
		mainStack.layoutVertically();

		this.setList(mainStack, ['可用天数', this.remainingDays.toString(), '天'], this.smallStackColor);
		mainStack.addSpacer();
		this.setList(mainStack, ['每月费用', this.monthlyFee, '元'], this.endColor);
	}

	// 小组件样式3 - 完全仿照国网setWidgetStyle_3
	async setWidgetStyle_3(stack, color) {
		//  标题
		this.setTitle(stack, new Color(color), new Color(color));
		stack.addSpacer();

		// 套餐信息
		const packageData = ['套餐类型', this.packageType, ''];
		if (packageData) {
			const packageStack = stack.addStack();
			packageStack.centerAlignContent();
			const packageTitle = packageStack.addText(packageData[0]);
			packageStack.addSpacer();
			const packageValue = packageStack.addText(packageData[1]);
			packageTitle.font = Font.regularRoundedSystemFont(12 * this.SCALE);
			packageValue.font = Font.regularRoundedSystemFont(14 * this.SCALE);
			[packageTitle, packageValue].map(t => {
				t.textColor = new Color(color);
			});
		}

		stack.addSpacer();

		//  余额
		const downStack = stack.addStack();
		const titleStack = downStack.addStack();
		titleStack.layoutVertically();
		const balanceTitleText = titleStack.addText('宽带余额');
		const balanceStack = titleStack.addStack();
		const balanceText = balanceStack.addText(`${this.balance}`);
		balanceStack.addSpacer(1);
		this.unit(balanceStack, '元', 8.5 * this.SCALE, new Color(color));

		balanceTitleText.font = Font.systemFont(12 * this.SCALE);
		balanceTitleText.textOpacity = 0.7;
		balanceText.font = Font.semiboldRoundedSystemFont(20 * this.SCALE);
		[balanceTitleText, balanceText].map(t => {
			t.textColor = new Color(color);
		});

		downStack.addSpacer();
		let wsgw = downStack.addImage(await this.getLogo());
		wsgw.tintColor = new Color(color);
		wsgw.imageSize = new Size(36 * this.SCALE, 36 * this.SCALE);
	}

	// 小组件渲染 - 改为与中组件一致的设计
	renderSmall = async (w) => {
		w.setPadding(0, 0, 0, 0);
		w.backgroundColor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
		const updateColor = new Color('#2F6E6B');
		const bodyStack = w.addStack();

		//  左侧stack - 与中组件完全一致但调整尺寸
		const leftStack = bodyStack.addStack();
		leftStack.layoutVertically();
		leftStack.setPadding(0, 12, 0, 12);
		leftStack.size = new Size((this.size.leftStack / this.SCALE) * 0.7, 0); // 小组件适当缩小
		leftStack.backgroundColor = Color.dynamic(new Color(this.settings.leftDayColor || "#F2F2F7"), new Color(this.settings.leftNightColor || "#1C1C1E"));

		//  标题及LOGO - 与中组件完全一致
		leftStack.addSpacer();
		const logoStack = leftStack.addStack();
		logoStack.addSpacer();
		let wsgw = logoStack.addImage(await this.getLogo());
		wsgw.imageSize = new Size(this.size.logo * 0.8, this.size.logo * 0.8); // 小组件Logo稍小
		logoStack.addSpacer();

		leftStack.addSpacer();
		this.setUpdateStack(leftStack, updateColor);
		leftStack.addSpacer(2);

		const balanceStackBgcolor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
		this.balance = this.balance;
		this.setBalanceStack(leftStack, balanceStackBgcolor, 6 * this.SCALE, this.size.balance * 0.9, this.size.smallFont, 3.5); // 小组件适当缩小
		leftStack.addSpacer(12);

		this.split(bodyStack, 0.5, 0, true);

		//  右侧Stack - 简化版的右侧内容
		const rightStack = bodyStack.addStack();
		rightStack.setPadding(12, 12, 12, 12);
		rightStack.layoutVertically();

		// 可用天数
		const remainingStack = rightStack.addStack();
		remainingStack.layoutHorizontally();
		remainingStack.centerAlignContent();

		const remainingBar = remainingStack.addStack();
		remainingBar.size = new Size(6 * this.SCALE, 25 * this.SCALE);
		remainingBar.cornerRadius = 3 * this.SCALE;
		remainingBar.backgroundColor = new Color('#4CAF50');

		remainingStack.addSpacer(8 * this.SCALE);

		const remainingContent = remainingStack.addStack();
		remainingContent.layoutVertically();
		remainingContent.addSpacer(1 * this.SCALE);

		const remainingTitle = remainingContent.addText('可用天数');
		remainingTitle.font = Font.systemFont(9 * this.SCALE);
		remainingTitle.textColor = this.widgetColor;
		remainingTitle.textOpacity = 0.5;

		const remainingValueStack = remainingContent.addStack();
		remainingValueStack.centerAlignContent();

		const remainingValue = remainingValueStack.addText(this.remainingDays.toString());
		remainingValue.font = Font.boldRoundedSystemFont(14 * this.SCALE);
		remainingValue.textColor = this.widgetColor;

		remainingValueStack.addSpacer();

		const remainingUnitStack = remainingValueStack.addStack();
		remainingUnitStack.cornerRadius = 3 * this.SCALE;
		remainingUnitStack.borderWidth = 1;
		remainingUnitStack.borderColor = new Color('#4CAF50');
		remainingUnitStack.setPadding(1, 2.5 * this.SCALE, 1, 2.5 * this.SCALE);
		remainingUnitStack.backgroundColor = Color.dynamic(new Color('#4CAF50'), new Color('#4CAF50', 0.3));

		const remainingUnit = remainingUnitStack.addText('天');
		remainingUnit.font = Font.mediumRoundedSystemFont(9 * this.SCALE);
		remainingUnit.textColor = Color.dynamic(Color.white(), new Color('#4CAF50'));

		rightStack.addSpacer();

		// 每月费用
		const monthlyStack = rightStack.addStack();
		monthlyStack.layoutHorizontally();
		monthlyStack.centerAlignContent();

		const monthlyBar = monthlyStack.addStack();
		monthlyBar.size = new Size(6 * this.SCALE, 25 * this.SCALE);
		monthlyBar.cornerRadius = 3 * this.SCALE;
		monthlyBar.backgroundColor = new Color('#2196F3');

		monthlyStack.addSpacer(8 * this.SCALE);

		const monthlyContent = monthlyStack.addStack();
		monthlyContent.layoutVertically();
		monthlyContent.addSpacer(1 * this.SCALE);

		const monthlyTitle = monthlyContent.addText('每月费用');
		monthlyTitle.font = Font.systemFont(9 * this.SCALE);
		monthlyTitle.textColor = this.widgetColor;
		monthlyTitle.textOpacity = 0.5;

		const monthlyValueStack = monthlyContent.addStack();
		monthlyValueStack.centerAlignContent();

		const monthlyValue = monthlyValueStack.addText(this.monthlyFee);
		monthlyValue.font = Font.boldRoundedSystemFont(14 * this.SCALE);
		monthlyValue.textColor = this.widgetColor;

		monthlyValueStack.addSpacer();

		const monthlyUnitStack = monthlyValueStack.addStack();
		monthlyUnitStack.cornerRadius = 3 * this.SCALE;
		monthlyUnitStack.borderWidth = 1;
		monthlyUnitStack.borderColor = new Color('#2196F3');
		monthlyUnitStack.setPadding(1, 2.5 * this.SCALE, 1, 2.5 * this.SCALE);
		monthlyUnitStack.backgroundColor = Color.dynamic(new Color('#2196F3'), new Color('#2196F3', 0.3));

		const monthlyUnit = monthlyUnitStack.addText('元');
		monthlyUnit.font = Font.mediumRoundedSystemFont(9 * this.SCALE);
		monthlyUnit.textColor = Color.dynamic(Color.white(), new Color('#2196F3'));

		return w;
	}

	// 大组件渲染 - 改为与中组件一致的设计，只是比例更大
	renderLarge = async (w) => {
		w.setPadding(0, 0, 0, 0);
		w.backgroundColor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
		const updateColor = new Color('#2F6E6B');
		const bodyStack = w.addStack();

		//  左侧stack - 与中组件完全一致但比例更大
		const leftStack = bodyStack.addStack();
		leftStack.layoutVertically();
		leftStack.setPadding(0, 18, 0, 18);
		leftStack.size = new Size((this.size.leftStack / this.SCALE) * 1.2, 0); // 大组件适当放大
		leftStack.backgroundColor = Color.dynamic(new Color(this.settings.leftDayColor || "#F2F2F7"), new Color(this.settings.leftNightColor || "#1C1C1E"));

		//  标题及LOGO - 与中组件完全一致
		leftStack.addSpacer();
		const logoStack = leftStack.addStack();
		logoStack.addSpacer();
		let wsgw = logoStack.addImage(await this.getLogo());
		wsgw.imageSize = new Size(this.size.logo * 1.2, this.size.logo * 1.2); // 大组件Logo稍大
		logoStack.addSpacer();

		leftStack.addSpacer();
		this.setUpdateStack(leftStack, updateColor);
		leftStack.addSpacer(2);

		const balanceStackBgcolor = Color.dynamic(new Color(this.settings.rightDayColor || "#E2E2E7"), new Color(this.settings.rightNightColor || "#2C2C2F"));
		this.balance = this.balance;
		this.setBalanceStack(leftStack, balanceStackBgcolor, 10 * this.SCALE, this.size.balance * 1.1, this.size.smallFont * 1.1, 5); // 大组件适当放大
		leftStack.addSpacer(18);

		this.split(bodyStack, 0.5, 0, true);

		//  右侧Stack - 与中组件完全一致
		const rightStack = bodyStack.addStack();
		rightStack.setPadding(18, 18, 18, 18);
		rightStack.layoutVertically();

		// 第一行：可用天数 和 每月费用
		const firstRow = rightStack.addStack();
		firstRow.layoutHorizontally();
		firstRow.spacing = 15;

		// 可用天数
		const remainingStack = firstRow.addStack();
		remainingStack.layoutHorizontally();
		remainingStack.centerAlignContent();

		const remainingBar = remainingStack.addStack();
		remainingBar.size = new Size(8 * this.SCALE, 35 * this.SCALE);
		remainingBar.cornerRadius = 4 * this.SCALE;
		remainingBar.backgroundColor = new Color('#4CAF50');

		remainingStack.addSpacer(12 * this.SCALE);

		const remainingContent = remainingStack.addStack();
		remainingContent.layoutVertically();
		remainingContent.addSpacer(2 * this.SCALE);

		const remainingTitle = remainingContent.addText('可用天数');
		remainingTitle.font = Font.systemFont(11 * this.SCALE);
		remainingTitle.textColor = this.widgetColor;
		remainingTitle.textOpacity = 0.5;

		const remainingValueStack = remainingContent.addStack();
		remainingValueStack.centerAlignContent();

		const remainingValue = remainingValueStack.addText(this.remainingDays.toString());
		remainingValue.font = Font.boldRoundedSystemFont(18 * this.SCALE);
		remainingValue.textColor = this.widgetColor;

		remainingValueStack.addSpacer();

		const remainingUnitStack = remainingValueStack.addStack();
		remainingUnitStack.cornerRadius = 4 * this.SCALE;
		remainingUnitStack.borderWidth = 1;
		remainingUnitStack.borderColor = new Color('#4CAF50');
		remainingUnitStack.setPadding(1, 3 * this.SCALE, 1, 3 * this.SCALE);
		remainingUnitStack.backgroundColor = Color.dynamic(new Color('#4CAF50'), new Color('#4CAF50', 0.3));

		const remainingUnit = remainingUnitStack.addText('天');
		remainingUnit.font = Font.mediumRoundedSystemFont(11 * this.SCALE);
		remainingUnit.textColor = Color.dynamic(Color.white(), new Color('#4CAF50'));

		// 每月费用
		const monthlyStack = firstRow.addStack();
		monthlyStack.layoutHorizontally();
		monthlyStack.centerAlignContent();

		const monthlyBar = monthlyStack.addStack();
		monthlyBar.size = new Size(8 * this.SCALE, 35 * this.SCALE);
		monthlyBar.cornerRadius = 4 * this.SCALE;
		monthlyBar.backgroundColor = new Color('#2196F3');

		monthlyStack.addSpacer(12 * this.SCALE);

		const monthlyContent = monthlyStack.addStack();
		monthlyContent.layoutVertically();
		monthlyContent.addSpacer(2 * this.SCALE);

		const monthlyTitle = monthlyContent.addText('每月费用');
		monthlyTitle.font = Font.systemFont(11 * this.SCALE);
		monthlyTitle.textColor = this.widgetColor;
		monthlyTitle.textOpacity = 0.5;

		const monthlyValueStack = monthlyContent.addStack();
		monthlyValueStack.centerAlignContent();

		const monthlyValue = monthlyValueStack.addText(this.monthlyFee);
		monthlyValue.font = Font.boldRoundedSystemFont(18 * this.SCALE);
		monthlyValue.textColor = this.widgetColor;

		monthlyValueStack.addSpacer();

		const monthlyUnitStack = monthlyValueStack.addStack();
		monthlyUnitStack.cornerRadius = 4 * this.SCALE;
		monthlyUnitStack.borderWidth = 1;
		monthlyUnitStack.borderColor = new Color('#2196F3');
		monthlyUnitStack.setPadding(1, 3 * this.SCALE, 1, 3 * this.SCALE);
		monthlyUnitStack.backgroundColor = Color.dynamic(new Color('#2196F3'), new Color('#2196F3', 0.3));

		const monthlyUnit = monthlyUnitStack.addText('元');
		monthlyUnit.font = Font.mediumRoundedSystemFont(11 * this.SCALE);
		monthlyUnit.textColor = Color.dynamic(Color.white(), new Color('#2196F3'));

		rightStack.addSpacer();
		this.split(rightStack, 0, 0.5 * this.SCALE);
		rightStack.addSpacer();

		// 第二行：套餐类型 和 状态
		const secondRow = rightStack.addStack();
		secondRow.layoutHorizontally();
		secondRow.spacing = 15;

		// 套餐类型
		const packageStack = secondRow.addStack();
		packageStack.layoutHorizontally();
		packageStack.centerAlignContent();

		const packageBar = packageStack.addStack();
		packageBar.size = new Size(8 * this.SCALE, 35 * this.SCALE);
		packageBar.cornerRadius = 4 * this.SCALE;
		packageBar.backgroundColor = new Color('#FFB347');

		packageStack.addSpacer(12 * this.SCALE);

		const packageContent = packageStack.addStack();
		packageContent.layoutVertically();
		packageContent.addSpacer(2 * this.SCALE);

		const packageTitle = packageContent.addText('套餐类型');
		packageTitle.font = Font.systemFont(11 * this.SCALE);
		packageTitle.textColor = this.widgetColor;
		packageTitle.textOpacity = 0.5;

		const packageValueStack = packageContent.addStack();
		packageValueStack.centerAlignContent();

		const packageValue = packageValueStack.addText(this.packageType);
		packageValue.font = Font.boldRoundedSystemFont(18 * this.SCALE);
		packageValue.textColor = this.widgetColor;

		packageValueStack.addSpacer();

		// 状态
		const statusStack = secondRow.addStack();
		statusStack.layoutHorizontally();
		statusStack.centerAlignContent();

		const statusBar = statusStack.addStack();
		statusBar.size = new Size(8 * this.SCALE, 35 * this.SCALE);
		statusBar.cornerRadius = 4 * this.SCALE;
		statusBar.backgroundColor = new Color('#9C27B0');

		statusStack.addSpacer(12 * this.SCALE);

		const statusContent = statusStack.addStack();
		statusContent.layoutVertically();
		statusContent.addSpacer(2 * this.SCALE);

		const statusTitle = statusContent.addText('余额状态');
		statusTitle.font = Font.systemFont(11 * this.SCALE);
		statusTitle.textColor = this.widgetColor;
		statusTitle.textOpacity = 0.5;

		const statusValueStack = statusContent.addStack();
		statusValueStack.centerAlignContent();

		const statusText = this.balance > 30 ? '正常' : this.balance > 10 ? '偏低' : '不足';
		const statusValue = statusValueStack.addText(statusText);
		statusValue.font = Font.boldRoundedSystemFont(18 * this.SCALE);
		statusValue.textColor = this.widgetColor;

		statusValueStack.addSpacer();

		return w;
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
		const scriptName = Script.name() + '.js';
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
						url: PROXY_URL + 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/useICloud.png',
						type: 'switch',
						title: 'iCloud',
						val: 'useICloud',
					},
					{
						url: PROXY_URL + 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/update.png',
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
						url: PROXY_URL + 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/reset.png',
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
						url: PROXY_URL + 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/reload.png',
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
