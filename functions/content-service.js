'use strict';
const {normalize, assertAdmin, fail} = require('./content-model');
// These documents are server-only under the existing default-deny rules.
// getPublished never reads the draft or returns editor identity.
function service(db, stamp) {
  const draftRef = db.doc('school_portal_content/homepage-draft');
  const publicRef = db.doc('school_portal_content/homepage-published');
  async function handle(request) {
    const input = request.data || {};
    if (input.method === 'getPublished') {
      const snap = await publicRef.get();
      return {content: snap.exists ? snap.data().content : null, revision: snap.exists ? snap.data().revision : 0};
    }
    if (!['getDraft','saveDraft','publish'].includes(input.method)) fail('คำสั่งไม่ถูกต้อง');
    if (!request.auth) fail('กรุณาเข้าสู่ระบบ', 'unauthenticated');
    const actorRef = db.doc('school_users/' + request.auth.uid);
    // Check before parsing submitted content, and again within the write transaction.
    assertAdmin(request.auth, (await actorRef.get()).data());
    if (input.method === 'getDraft') {
      const [draft, published] = await Promise.all([draftRef.get(), publicRef.get()]);
      return {content:draft.data()?.content || published.data()?.content || null, revision:draft.data()?.revision || 0, publishedRevision:published.data()?.revision || 0};
    }
    if (!Number.isSafeInteger(input.revision) || input.revision < 0) fail('รุ่นข้อมูลไม่ถูกต้อง');
    const content = input.method === 'saveDraft' ? normalize(input.content) : null;
    return db.runTransaction(async tx => {
      const actor = await tx.get(actorRef); assertAdmin(request.auth, actor.data());
      const current = await tx.get(draftRef), revision = current.data()?.revision || 0;
      if (revision !== input.revision) fail('มีผู้ดูแลแก้ไขข้อมูลแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก', 'aborted');
      const metadata = {updatedBy:request.auth.uid, updatedAt:stamp()};
      if (input.method === 'saveDraft') {
        const next={...content};for(const key of ['heroLabel','schoolInfo','staff'])if(!Object.hasOwn(input.content,key)&&current.data()?.content?.[key]!==undefined)next[key]=current.data().content[key];
        tx.set(draftRef, {content:normalize(next), revision:revision + 1, ...metadata});
        tx.set(db.collection('school_portal_audit').doc(), {action:'save-draft',revision:revision+1,...metadata});
        return {ok:true,revision:revision+1};
      }
      if (!current.exists) fail('กรุณาบันทึกฉบับร่างก่อนเผยแพร่','failed-precondition');
      // Revalidate stored drafts to keep publication within the same schema.
      tx.set(publicRef,{content:normalize(current.data().content),revision,...metadata});
      tx.set(db.collection('school_portal_audit').doc(),{action:'publish',revision,...metadata});
      return {ok:true,revision,publishedRevision:revision};
    });
  }
  return {handle};
}
module.exports = {service};
