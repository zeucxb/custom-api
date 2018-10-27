const Koa = require('koa');
const Router = require('koa-router');
const serve = require('koa-static');
const bodyParser = require('koa-bodyparser');

const jsyaml = require('js-yaml');
const axios = require('axios');

const app = new Koa();
const router = new Router({ prefix: '/admin' });

const { dir_files, read_file } = require('./helpers/files');
const { join } = require('path');

const configDir = join(__dirname, './configs');
const parseDir = join(__dirname, './parsers');

const app_route = () => {
  router.get('*', ctx =>
    read_file(__dirname + '/statics/admin/index.html')
      .then(file => {
        ctx.set('Content-Type', 'text/html');
        ctx.body = file;
      })
  );
}

const proccess = (content) =>
  jsyaml.load(content);

const parser = parserName => data => parserName
  ? require(join(parseDir, parserName))(data)
  : data;

const parse_params = (params, router_params) => {
  for (let key in params) {
    if (params.hasOwnProperty(key)) {
      const param = params[key];

      if (typeof param === 'string' && param.indexOf('$') === 0) {
        params[key] = router_params[param.substr(1)];
      }

      if (typeof param === 'object' && !Array.isArray(param)) {
        params[key] = parse_params(param, router_params);
      }
    }
  }

  return params;
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const create_routers = (configs) => configs
  .map(config =>
    router[config.method](config.path, ctx =>
      axios[config.request.method](
        `${config.request.host}${config.request.path}`,
        parse_params(
          config.request.params,
          parser(config['pre-parser'])({ ...ctx.request.query, ...ctx.request.body }),
        ),
      ).then(response =>
        parser(config['post-parser'])(response.data)
      ).then(body => ctx.body = body)
    )
  );

const start_app = () =>
  app
    .use(bodyParser())
    .use(serve(__dirname + '/statics'))
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(3000, console.log('Application runnig at http://localhost:3000'));

dir_files(configDir)
  .then(files =>
    Promise.all(files
      .map(file =>
        read_file(join(configDir, file))
          .catch(console.error)
      )
    )
  )
  .then(loadedFiles =>
    loadedFiles
      .filter(value => !!value)
      .map(proccess)
  )
  .then(create_routers)
  .then(app_route)
  .then(start_app)
  .catch(console.error);