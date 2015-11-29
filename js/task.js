/**
*	封装任务对象
*
*/

function Task(options){
	var d = new Date();
	options = AS.extend({
		'tid': d.getTime(),
		'content': '没有任务描述',
		'_flash': false,
		'is_finished': false,
		'created_at': d.toLocaleString()
	}, options);
	/* 属性 */
	this.tid = options.tid; //任务id
	this._flash = options._flash; //是否已关注
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
	Object.observe(this, function(changes){
		var changeType = changes[0].type;
		var changeAttr = changes[0].name;
		var changeOldvalue = changes[0].oldValue;
		console.log('task: changeType='+changeType+' '+changeAttr+'='+changes[0].object[changeAttr]);
		if('update' === changeType){
			that._store(false);
		}else{
			that._store(true);
		}
		
	});
	AS.TID2TASK[this.tid] = this;
}

Task.prototype = {
	render: function(newData){
		console.log('=====');
		var $tmpl_html, $container;
		if(this.is_finished){
			$tmpl_html = $('#finished-tap-template');
			$container = $('.a-slider-container');
		}else{
			$tmpl_html = $('#tap-template');
			$container = $('.a-list');
		}
		if(newData){
			var template = Handlebars.compile($tmpl_html.html());
			$container.append(template(this.toJSON()));
			$('[data-toggle="tooltip"]').tooltip();
		}
		
		return this;
	},
	setFlash: function(bool){
		this._flash = !!bool;
		return this;
	},
	finish: function(){
		this.is_finished = true;
		return this;
	},
	edit: function(input){ //格式为 “title::content”
		var input_arr = input.split('::');
		var len = input_arr.length;
		var title, content;
		if(len = 1){
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
		return this;
	},
	toJSON: function(){
		return {
			"tid": this.tid,
			"_flash": this._flash,
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


