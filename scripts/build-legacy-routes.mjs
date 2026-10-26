import fs from 'node:fs/promises';
const episodes=JSON.parse(await fs.readFile('app/saudi-episodes.json','utf8'));const routes={};const posts={};
const key=value=>decodeURIComponent(new URL(value).pathname).replace(/\/+$/,'')||'/';
for(const e of episodes){routes[key(e.sourceUrl)]='/episode/'+e.id;posts[String(e.sourcePostId)]='/episode/'+e.id;if(e.sourceImage&&new URL(e.sourceImage).hostname==='saudi-podcasts.com'&&e.image.startsWith('/thumbnails/'))routes[key(e.sourceImage)]=e.image;}
await fs.writeFile('app/legacy-routes.json',JSON.stringify({routes,posts},null,2)+'\n');console.log('Generated',Object.keys(posts).length,'post redirects and',Object.keys(routes).length-Object.keys(posts).length,'image redirects');
