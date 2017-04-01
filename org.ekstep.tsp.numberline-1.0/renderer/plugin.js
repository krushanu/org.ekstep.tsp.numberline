Plugin.extend({
    _type: 'org.ekstep.tsp.numberline',
    _isContainer: true,
    _render: true,
    _currentPos: 1,
    _nextAnswer: undefined,
    _bot: undefined,
    _boxes: undefined,
    _probText: undefined,
    _assessStartEvent: undefined,

    initPlugin: function(data) {
        console.log('data', data);

        this._self = new createjs.Container();
        data.w = data.w || 100;
        data.h = data.h || 100;
        var dims = this.relativeDims();
        this._self.x = dims.x;
        this._self.y = dims.y;

        this._boxes = [];
        var x = 0;
        var y = 70;
        var h = 30;
        var w = 10;

        var box = {};
        box.id = data.id + '_' + i;
        box.w = w;
        box.h = h;
        box.x = x;
        box.y = y;
        box.type = 'rect';
        box.align = 'center';
        box.valign = 'middle';
        box.color = data.color;
        box.stroke = data.stroke;
        box.fill = data.fill;
        box.opacity = data.opacity;
        box.fontsize = '6vw';

        var instance = this;

        for (var i = 0; i < 10; i++) {

            // Render the border box
            box.id = data.id + '_' + i;
            box.__text = (i + 1);
            box.x = x;
            box.stroke = data.stroke;
            var boxShape = PluginManager.invoke('shape', box, this, this._stage, this._theme);
            boxShape._self.on("click", instance.clicked, null, false, {num:(i+1), me: this});
            this._boxes.push(boxShape);

            // Render the text without border
            box.stroke = undefined;
            var boxNum = PluginManager.invoke('text', box, this, this._stage, this._theme);
            x = x + w;
        }

        // Render the bot
        var image = box;
        image.id = data.id + '_' + 'img';
        image.y = 40;
        image.x = 0;
        image.align = undefined;
        image.valign = undefined;
        image.asset = 'numline_bot';

        this._bot = PluginManager.invoke('image', image, this, this._stage, this._theme);

        // Render the question
        this._nextAnswer = this.nextProblem();
        console.log('generated ' + this._nextAnswer);
        var diff = this._nextAnswer - this._currentPos;

        var prob = {};
        prob.id = data.id + '_' + i;
        prob.w = 100;
        prob.h = 40;
        prob.x = 0;
        prob.y = 0;
        prob.align = 'center';
        prob.valign = 'middle';
        prob.color = data.color;
        prob.fontsize = '20vw';
        prob.__text = (diff >= 0 ? '+' + diff : diff);
        this._probText = PluginManager.invoke('text', prob, this, this._stage, this._theme);

        this._probText._self.shadow = new createjs.Shadow('green', 5, 5, 20);

        this.startTelemetry();
        this.resetPiBot();

    },
    clicked: function(event, data) {
        var instance = data.me;

        if (data.num == instance._nextAnswer) {
            EkstepRendererAPI.play('bot_move');
            instance.endTelemetry(true, data.num);
            instance.moveBot(data.num);
        }
        else {
            EkstepRendererAPI.play('bot_wrong');
            instance.endTelemetry(false, data.num);
        }
    },
    moveBot: function(num) {

        var instance = this;
        var diff = num - instance._currentPos;
        var target = instance._boxes[num-1]._self;
        instance._currentPos = num;

        // Move the bot to the target number
        // After animation is completed, regenerate the problem
        var tween = createjs.Tween.get(instance._bot._self, {loop:false})
                .to({x: target.x}, 2000, createjs.Ease.cubicIn)
                .call(instance.handleComplete, [instance])
                .addEventListener("change", instance.handleChange);

        instance.movePiBot(diff);
    },
    movePiBot: function(diff) {
        var direction = (diff < 0) ? 'backward' : 'forward';
        diff = (diff < 0 ? -diff : diff);
        $.getJSON("https://localhost:3443/" + direction + '/' + diff,
        function(data) {
            console.log('Raspberry Pi Returned ' + data);
        });
    },
    resetPiBot: function() {
        $.getJSON("https://localhost:3443/reset",
        function(data) {
            console.log('Raspberry Pi Returned ' + data);
        });
    },
    handleChange: function(event) {
        Renderer.update = true;
    },
    handleComplete: function(data) {

        // Regenerate the problem
        var instance = data;
        instance._nextAnswer = instance.nextProblem();
        var diff = instance._nextAnswer - instance._currentPos;
        instance._probText._self.text = (diff >= 0 ? '+' + diff : diff);

        // Next problem started
        instance.startTelemetry();
    },
    nextProblem: function() {
        var instance = this;
        var nextNum = Math.floor((Math.random() * 10) + 1);
        while (nextNum == instance._currentPos) {
            nextNum = Math.floor((Math.random() * 10) + 1);
        }
        return nextNum;
    },
    startTelemetry: function() {
        this._assessStartEvent = TelemetryService.assess( 'org.ekstep.tsp.numberline', 'numeracy', 'EASY', {
            maxscore: 1
        }).start();
    },
    endTelemetry: function(resultPass, resValue) {
        var instance = this;

        var resultScore = (resultPass ? 1 : 0);
        var desc = instance._currentPos + instance._probText._self.text + ' = ?';

        var data = {
          pass: resultPass,
          score: resultScore,
          res: resValue,
          mmc: 'C201',
          qindex: 1,
          mc: 'C201',
          qtitle: 'Number Line',
          qdesc : desc
      };
      TelemetryService.assessEnd(instance._assessStartEvent, data);
    }
});
