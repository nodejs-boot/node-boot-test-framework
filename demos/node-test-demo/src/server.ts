import {TestAppWithMongoPersistence} from "./app";

new TestAppWithMongoPersistence()
    .start()
    .then(app => {
        app.logger.debug(`TestAppWithMongoPersistence started successfully at port ${app.appOptions.port}`);
    })
    .catch(reason => {
        console.error(`Error starting TestAppWithMongoPersistence: ${reason}`);
    });
