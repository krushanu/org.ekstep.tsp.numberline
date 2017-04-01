EkstepEditor.basePlugin.extend({
    initialize: function() {
    },
    newInstance: function() {
        var props = this.convertToFabric(this.attributes);
        this.editorObj = new fabric.Rect(props);
        if (this.editorObj) this.editorObj.setStroke(props.stroke);

        var bot = this.relativeURL('assets/numline_bot.png');
        this.addMedia({id: 'numline_bot', 'src': bot, 'type': 'image', 'preload': true});

        var bot_wrong = this.relativeURL('assets/bot_wrong.wav');
        this.addMedia({id: 'bot_wrong', 'src': bot_wrong, 'type': 'sound', 'preload': true});

        var bot_move = this.relativeURL('assets/bot_move.wav');
        this.addMedia({id: 'bot_move', 'src': bot_move, 'type': 'sound', 'preload': true});

    },
    onConfigChange: function(key, value) {
        var instance = EkstepEditorAPI.getCurrentObject();
        var editorObj = instance.editorObj
        switch (key) {
            case "color":
                editorObj.setStroke(value);
                instance.attributes.stroke = value;
                break;
        }
        EkstepEditorAPI.render();
        EkstepEditorAPI.dispatchEvent('object:modified', { target: EkstepEditorAPI.getEditorObject() });
    }
});
