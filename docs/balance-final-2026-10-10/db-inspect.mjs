import {PrismaClient} from '@prisma/client';
const db=new PrismaClient({datasourceUrl:'postgresql://rogue_e2e@127.0.0.1:55439/rogue_e2e?schema=public'});
const rows=await db.run.findMany({select:{id:true,status:true,updatedAt:true,state:true}});console.log(rows.map(r=>({id:r.id,status:r.status,date:r.updatedAt,room:r.state.currentRoom,floor:r.state.floor,revision:r.state.saveRevision,phase:r.state.combat?.phase})));await db.$disconnect();
