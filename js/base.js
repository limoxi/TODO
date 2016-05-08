var DBNAME = 'TODO';
var STORENAME = 'finishedData'
var generatorClicked = false;
//处理背景图适配
setBackground();
window.onresize = setBackground;
function setBackground(){
	var h = $(window).height();
	console.log('重置背景高度======', h);
	$('body').css({
		'background-size': '50px ' + h + 'px'
	});
}
$(function(){
	init();
	initToast();
	var uuid = AS.storage.get('uuid', AS.VALUE_TYPE['str']);
	if(!uuid){
		$('.a-uuid-checker').on('click', function(){
			var inputUuid = $('.a-uuid-container').find('input').val();
			if(inputUuid.trim() === ''){
				AS.toast('还没有身份id可以点击“生成”', 'error', 5);
				return;
			}
			//如果是离线状态
			if(!AS.is_online){
				if(generatorClicked){
					generatorClicked = false;
					AS.storage.set('uuid', inputUuid);
					next();
					$('.a-guide').hide();
				}else{
					AS.toast('离线状态不可用', 'warn');
				}
				return;
			}
			
			if(checkGenedUuid(inputUuid)){
				if(generatorClicked){
					generatorClicked = false;
					AS.storage.set('uuid', inputUuid);
					AS.sync.init(false, inputUuid);
					next();
					$('.a-guide').hide();
				}else{
					AS.sync.init(true, inputUuid, function(){
						$('.a-uuid-container').find('input').val('');
						AS.toast('id不存在，还没有身份id可以点击“生成”');
					});
				}
			}
		});
		$('.a-uuid-generator').on('click', function(){
			generatorClicked = true;
			var genUid = new Date().getTime().toString();
			$('.a-uuid-container').find('input').val(genUid).attr('readonly', true);
		});
		$('.a-guide').show();
	}else{
		AS.is_online && AS.sync.init(false, uuid);
		next();
	}
});

function init(){
	if(AS.browser.suported()){
		$('.a-main').show();
	}else{
		if(AS.browser.is_mobile()){
			$('.a-init-header').html('不支持移动端，请在PC上使用');
			$('.a-init-desc').html('暂不支持在IOS、Android手机、平板等任何移动设备上使用，未来可能会考虑Android App，苹果的就算了，呵呵...');
		}else{
			$('.a-init-header').html('不支持该浏览器');
			$('.a-init-desc').html('暂只支持webkit内核的浏览器，完全支持chrome，所以，建议使用最新版chrome进行浏览');
			$('.a-init-link').show();
		}
		$('.a-init').show();
	}
	//所有按钮行为，在点击后禁用1秒，防止意外连续点击
	$('.a-button').on('click', function(){
		var $that = $(this);
		$that.attr('disabled', true);
		window.setTimeout(function(){
			$that.attr('disabled', false);
		}, 1000);	
	});
	var storeVersion = AS.storage.get('version', AS.VALUE_TYPE['num'], 1);
	AS.storage.set('version', storeVersion);
}

function next(){
	connectDB(function(data){
		AS.finishedData = data;
		AS.store.init($('.a-list'));
		initTools();
		bindListeners();
		$('.a-userinfo .a-userid').html(AS.storage.get('uuid', AS.VALUE_TYPE['str']));
	});
}

//连接indexeddb数据库
function connectDB(callback){
	if(AS.finishedDB) return;
	AS.getDB(DBNAME).use(STORENAME, {keyPath: 'tid', success: function(){
		console.log('连接indexedDB成功');
		this.get(function(data){
			console.log('=========', data);
			AS.finishedDB = this;
			callback(data);
		});
	}});
}

/**
*	检查输入的uuid
*	uuid只能是日期new Date().getTime()得到的一串数字或字符串
*/
function checkGenedUuid(uuid){
	var errMsg = '请填写已经拥有的身份id或者重新生成';
	if(!/^[0-9]*$/.test(uuid)){
		AS.toast(errMsg, 'warn', 5);
		return;
	}
	uuid = parseInt(uuid);
	var fiveYearsTime = 1000*60*60*24*365*5,
		nowTime = new Date().getTime();
	var dif = nowTime - uuid;
	if(dif > fiveYearsTime || dif <= 0){
		AS.toast(errMsg, 'warn', 5);
		return;
	}
	return true;
}

function bindListeners(){
	var tmpl = $('#tap-template').html();
	$('.a-tap-new').on('keyup', function(e){
		var input = $(this).val().trim();
		if(input == '' || e.keyCode != 13) return;
		var datetime = new Date().toLocaleString();
		var tid = $(this).attr('data-target'), title, content;
		if(tid){
			var task = AS.TID2TASK[tid];
			task.edit(input);
			title = task.title;
			content = task.content;
			$('.a-list').find('a[data-key="'+tid+'"]').find('.a-tap-title').html(title).end().find('.a-tap-content').html(content);
		}else{
			var inputArr = input.split('::');
			var options = {};
			if(inputArr.length == 1){
				options['content'] = input;
			}else{
				options['title'] = inputArr[0];
				options['content'] = inputArr[1];
			}
			AS.store.add(options);
			
		}
		$(this).attr('data-target', '').val('').blur();
	});

	this.editting = false;
	$('.a-container').delegate('.a-tap-header span', 'click', function(){
		var $tap = $(this).parents('.a-tap');
		var tid = $tap.attr('data-key');
		var task = AS.TID2TASK[tid];
		if($(this).hasClass('a-tap-delete')){
			//删除
			AS.store.remove(AS.TODO_DATA, tid);
			$tap.remove();
		}else if($(this).hasClass('a-tap-done')){
			//完成
			AS.store.finish(tid);
			$tap.remove();
		}else if($(this).hasClass('a-tap-edit')){
			//编辑
			$('.a-tap-new').val(task.title+"::"+task.content).attr('data-target', tid).focus();
		}else if($(this).hasClass('a-tap-flash')){
			//关注
			task.setFlash(!$(this).hasClass('action'));
			$(this).toggleClass('action').parent().parent().toggleClass('animation-flash');
		}else if($(this).hasClass('a-tap-routine')){
			//日常
			task.setRoutine(!$(this).hasClass('action'));
			$(this).toggleClass('action');
		}
	});

	//关闭页面时给出同步提示
	$(window).on('beforeunload', function(){
		return '～请确保数据已同步到云～';
	});
}

function initTools(){
	//通知图标
	var $tooltip = $('.a-notify'), notifyTimer;
	var updateNotifyStatus = function(){
		var content = '已开启桌面通知',
			status = AS.storage.get('notify', AS.VALUE_TYPE['str'], 'on');
		if(AS.notifyToolTip){
			AS.notifyToolTip.tooltip('destroy');
			AS.notifyToolTip = null;
			if('on' === status){
	    		$('.a-notify').removeClass('action');
				content = '已关闭桌面通知';
				status = 'off';
	    	}else{
	    		$('.a-notify').addClass('action');
	    		status = 'on';
	    	}
	    	AS.storage.set('notify', status);
		}else{
			if('on' === status){
	    		$('.a-notify').addClass('action');
	    	}else{
	    		$('.a-notify').removeClass('action');
	    		content = '已关闭桌面通知';
	    	}
		}
		//由于destroy方法耗时较长，可能初始化动作已完成destroy还没执行，此时就会将新的tooltip给destroy掉
		//所以这里初始化动作延时400ms执行，确保之前的destroy动作已完成
		notifyTimer && window.clearTimeout(notifyTimer);
		notifyTimer = window.setTimeout(function(){
			AS.notifyToolTip = $tooltip.tooltip({
		        placement: 'top',
		        title: content
		    });
		    AS.notifyToolTip.tooltip('show');
		}, 400);
    	
	};
	$('.a-notify').on('click', updateNotifyStatus);
	updateNotifyStatus();
	
	$('.a-doneList').tooltip().on('click', function(){
		$('.a-slider-container').toggle('fast');
	});
	//设置
	$('.a-setting').popover({
		html: true,
		placement: 'top',
		container: 'body',
		content: '<input placeholder="消息提醒频率(分钟)" class="a-setting-timer">\
					<button type="button" class="a-setting-set"> 设置 </button>'
	}).on('shown.bs.popover', function(){
		$('.a-setting-set').on('click', function(){
			var timer = $('.a-setting-timer').val();
			if(!timer || timer.trim() == ''){
				AS.toast('设置频率不能为空', 'warn');
				return;
			}
			timer = parseInt(timer)*60;
			AS.store.setTimerFrequency(timer);
		});
	}).parent().tooltip();
	//时间
	$('.a-observer').popover({
		html: true,
		placement: 'top',
		container: 'body',
		content: '<label><input placeholder="分钟" class="a-observer-time"></label>\
				   <input type="hidden" class="a-observer-color">\
				   <div class="a-observer-color-picker"><span style="background:#66FF00" data-hex="#66FF00"></span>\
				   <span style="background:#99FF00" data-hex="#99FF00"></span>&nbsp;<span style="background:#CCFF00" data-hex="#CCFF00"></span>\
				   <span style="background:#FFFF00" data-hex="#FFFF00"></span>&nbsp;<span style="background:#FFCC00" data-hex="#FFCC00"></span>\
				   <span style="background:#99CC00" data-hex="#99CC00"></span>&nbsp;<span style="background:#66CC00" data-hex="#66CC00"></span>\
				   <span style="background:#FF6600" data-hex="#FF6600"></span>&nbsp;<span style="background:#FF3300" data-hex="#FF3300"></span>\
				   <span style="background:#FF00FF" data-hex="#FF00FF"></span>&nbsp;<span style="background:#CC00FF" data-hex="#CC00FF"></span>\
				   <span style="background:#9900FF" data-hex="#9900FF"></span>&nbsp;<span style="background:#FF0066" data-hex="#FF0066"></span>\
				   <span style="background:#00CCFF" data-hex="#00CCFF"></span>&nbsp;<span style="background:#0099FF" data-hex="#0099FF"></span>\
				   <span style="background:#00CC99" data-hex="#00CC99"></span>&nbsp;<span style="background:#669999" data-hex="#669999"></span>\
				   <span style="background:#990033" data-hex="#990033"></span>&nbsp;<span style="background:#999999" data-hex="#999999"></span>\
				   <span style="background:#CCCCFF" data-hex="#CCCCFF"></span>&nbsp;<span style="background:#9933FF" data-hex="#9933FF"></span></div>\
				   <button type="button" class="a-observer-set"> 设置 </button>'
	}).on('shown.bs.popover', function(){
		//绑定时间设置事件
		$('.a-observer-set').on('click', function(){
			var time = $('.a-observer-time').val().trim();
			var color = $('.a-observer-color').val().trim();
			AS.store.setColorfulStatus(time, color)
		});
		//绑定颜色选择事件
		$('.a-observer-color-picker').delegate('span', 'click', function(){
			var color = $(this).attr('data-hex');
			$(this).css('border', '3px dashed black').siblings().css('border', 'none');
			$('.a-observer-color').val(color);
		});
	}).parent().tooltip();
	//同步
	$('.a-sync').tooltip().on('click', function(){
		if(AS.is_online){
			AS.sync.sync();
		}else{
			AS.toast.info('离线状态，无法同步～');
		}
	});
	//清除数据
	$('.a-clean').on('click', function(){
		var action = window.confirm('危险操作！！确定要清空本地数据么？');
		if(action){
			var save = window.confirm('需要保留当前身份信息么？');
			AS.storage.clear(!save);
			AS.delDB(DBNAME);
		}
	}).tooltip();
}

//消息提示
function initToast(){
	var type_class = {
		success: "alert-success",
		info: "alert-info",
		warn: "alert-warning",
		error: "alert-danger"
	};
	var toastTimer,
		$alert = $('.a-alert'),
		$alertMessage = $alert.find('.a-alert-message'),
		latestClass = "alert-info";
	AS.toast = function(msg, type, time){
		if(!msg || msg.trim()==='') return;
		useClass = type_class[type] || "alert-info";
		time = time || 2;
		window.clearTimeout(toastTimer);
		$alertMessage.html(msg);
		$alert.removeClass(latestClass).addClass(useClass).show();
		latestClass = useClass;
		toastTimer = window.setTimeout(function(){
			$alert.hide();
		}, time*1000);
		//TODO 纪录日志

	};
	if(!AS.is_online) AS.toast('当前处于离线状态~', 'info');
}

// 将‘2015/11/22 下午9:57:30’ 转换成 ‘2015/11/22 21:57:30’，以便转换成Date实例
function dateTransfer(dateStr){
	var rawHour = dateStr.substring(dateStr.indexOf(' ')+1, dateStr.indexOf(':'));
	if(rawHour.indexOf('下午') != -1){
		var hour = parseInt(rawHour.replace('下午','')) + 12;
		return new Date(dateStr.replace(rawHour, hour));
	}else if(rawHour.indexOf('上午') != -1){
		return new Date(dateStr.replace('上午', ''));
	}
	return new Date(dateStr);
}

 //临时的数据迁移方法
 //将DONE_DATA从loaclstorage迁移到indexeddb中
 (function(AS, window){
    AS.moveDoneData = function(){
        AS.backup = true;
        var finishedData_local = AS.store.get(AS.DONE_DATA);
        if(!finishedData_local || AS.isEmptyObject(finishedData_local)) return;
        for(var tid in finishedData_local){
            var data = finishedData_local[tid];
            new Task(data);
            AS.TID_ARRAY.push(tid);
        }
        window.localStorage.setItem('finishedData','');
    };
 })(AS, window);