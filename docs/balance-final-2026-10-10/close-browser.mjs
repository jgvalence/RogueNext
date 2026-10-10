import {connect} from './cdp.mjs';const b=await connect();await b.cdp('Browser.close');b.close();console.log('Local test browser closed before production build');
