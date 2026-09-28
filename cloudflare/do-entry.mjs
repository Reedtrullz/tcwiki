import app from './index.js';

export class WikiDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  fetch(request) {
    return app.fetch(request, this.env, this.state);
  }
}

export default {
  fetch(request, env) {
    return env.WIKI.get(env.WIKI.idFromName('primary')).fetch(request);
  },
};
