const transformHandler = (action) => {
  return async (req, res, next) => {
    try {
      const result = await action(req);
      if (!result) {
        return res.sendStatus(204);
      }
      res.status(200).send(result);
    } catch (err) {
      next(err);
    }
  };
};

const transformMiddleware = (action) => {
  return async (...args) => {
    const next = args[args.length - 1];
    try {
      await action(...args);
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = (app) => {
  const methods = ['get', 'post', 'put'];
  const handler = app;
  
  methods.forEach(method => {
    const origFunction = handler[method];

    handler[method] = function (...args) {
      if (!args.length) {
        return;
      }
      
      const func = origFunction.bind(this);
      const [path, ...actions] = args;

      if (actions.length === 0 && path instanceof Function) {
        return func(transformMiddleware(path));
      }
      
      const [action, ...middlewares] = actions.reverse();

      if (action instanceof Function) {
        if (!middlewares.length) {
          return func(path, transformHandler(action));
        }

        return func(path, ...[
          ...middlewares.map(transformMiddleware),
          transformHandler(action),
        ]);
      }
    
      return func(args);
    };
  });

  return handler;
};