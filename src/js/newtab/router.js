import Router from 'urlhub';

import urlhub from 'urlhub/urlhub';
import hashStrategy from './utils/hashStrategy';

import NewTile from './modules/newtile/NewTile'
import Browser from './modules/browser/Browser'

let routes = [
	{ path: '/', cb: NewTile },
	{ path: '/newtile', cb: NewTile },
	{ path: '/browser', cb: Browser}
];


let router = urlhub.create(routes, { strategy: hashStrategy });

export default router;
