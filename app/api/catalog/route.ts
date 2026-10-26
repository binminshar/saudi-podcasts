import {NextResponse} from 'next/server';
import {publicCatalog} from '../../lib/catalog-store';
export const dynamic='force-dynamic';
export async function GET(){const c=await publicCatalog();return NextResponse.json({episodes:c.episodes,sources:c.sources,authors:c.authors},{headers:{'Cache-Control':'no-store'}});}
