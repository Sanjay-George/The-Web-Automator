// BUILDER PATTERN
class ActionDirector
{
    async perform(logicBuilder) {
        logicBuilder.initOutputJSON();
        await logicBuilder.populateTargetsLabelsAndJsonKeys();
        await logicBuilder.iterate();
    }
}


module.exports = {
    ActionDirector
}

