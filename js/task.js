/**
*	封装任务对象
*
*/

function Task(options){
	var d = new Date();
	options = AS.extend({
		'tid': d.getTime(),
		'content': '没有任务描述',
		'flash': false,
		'routine': false,
		'is_finished': false,
		'created_at': d.toLocaleString()
	}, options);
	/* 属性 */
	this.tid = options.tid; //任务id
	this.flash = options.flash; //是否已关注
	this.routine = options.routine; //是否日常任务
	this.is_finished = options.is_finished; //是否已完成
	this.created_at = options.created_at; //任务创建时间
	this.title = options.title || ('TODO_TASK_'+this.tid); //任务标题
	this.content = options.content; //任务内容
	/* 私有方法(约定) */
	this._store = function(action){
		var json_str = this.toJSON();
		var mode = this.is_finished ? AS.DONE_DATA : AS.TODO_DATA;
		AS.store.set(mode, this.tid, json_str);
		this.render(action);
		return this;
	}; //存储到本地
	this._store(true);
	//监听对象变动
	var that = this;
	// Chrome最新版本m50已经废弃Object.observe方法,使用第三方解决方案
	// https://github.com/polymer/observe-js
	Object.observe(this, function(changes){
		var change = changes[0],
			changeType = change.type;
			changeAttr = change.name;
		AS.toast('操作成功～', 'success');
		if('update' === changeType && !that.is_finished){
			that._store(false);
		}else{
			that._store(true);
		}
		
	});
	AS.TID2TASK[this.tid] = this;
}

Task.prototype = {
	render: function(newData){
		this.getPassedTimeStr(); //更新经历的时间
		var $tmpl_html, $container;
		if(this.is_finished){
			$tmpl_html = $('#finished-tap-template');
			$container = $('.a-finished-list');
		}else{
			$tmpl_html = $('#tap-template');
			$container = $('.a-list');
		}
		var template = Handlebars.compile($tmpl_html.html());
		var html = template(this.toJSON());
		if(newData){
			//新任务，增加dom
			$container.append(html);
		}else{
			//修改任务，刷新dom
			$container.find('a[data-key="'+this.tid+'"]').replaceWith(html);
		}
		$('[data-toggle="tooltip"]').tooltip();
		AS.storage.set('storageChanged', 'true'); //标志本地数据已经改变
		
		return this;
	},
	setFlash: function(bool){
		this.flash = !!bool;
		return this;
	},
	setRoutine: function(bool){
		this.routine = !!bool;
		return this;
	},
	getPassedTimeStr: function(){
		var d = new Date(dateTransfer(this.created_at));
		var now = new Date();
		var diff = now - d;
		var s = diff / 1000;
		if(s < 60){
			this.passed = '';
			return this.passed;
		}
		var m = diff / 1000 / 60;
		if(m < 60){
			this.passed = Math.round(m) + '分';
			return this.passed;
		}
		var h = diff / 1000 / 60 / 60;
		if(h < 24){
			this.passed = Math.round(h) + '时';
			return this.passed;
		}
		this.passed = Math.round(diff / 1000 / 60 / 60 / 24) + '天';
		return this.passed;
	},
	finish: function(){
		this.is_finished = true;
		return this;
	},
	edit: function(input){ //格式为 “title::content”
		var input_arr = input.split('::');
		var len = input_arr.length;
		var title, content;
		if(len == 1){
			this.content = input.trim();
		}else if(len >2){
			this.title = input_arr[0].trim();
			for(var i=1;i<len;i++){
				this.content += input_arr[i];
			}
		}else{
			this.title = input_arr[0].trim();
			this.content = input_arr[1].trim();
		}
		this._editting = true;
		return this;
	},
	toJSON: function(){
		return {
			"tid": this.tid,
			"flash": this.flash,
			"passed": this.passed,
			"routine": this.routine,
			"is_finished": this.is_finished,
			"created_at": this.created_at,
			"title": this.title,
			"content": this.content
		};
	},
	toString: function(){
		return this.title + '::' + this.content;
	}
};



