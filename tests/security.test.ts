import {describe,it,expect} from 'vitest';
import {createConfirmationToken,verifyConfirmationToken} from '@/lib/security/confirmation';
import {VoiceIntent} from '@/lib/validations/voice';
process.env.AUTH_SECRET='test-secret-that-is-at-least-32-characters-long';
const intent:VoiceIntent={intent:'CREATE_TRANSACTION',entity_type:'CUSTOMER',entity_name:'Rahim',amount:15000,quantity:null,unit:null,transaction_type:'DUE_GIVEN',notes:null};
describe('confirmation tokens',()=>{it('accepts matching token',()=>{const t=createConfirmationToken('u1',intent);expect(verifyConfirmationToken(t,'u1',intent)).toBe(true)});it('rejects another user',()=>{const t=createConfirmationToken('u1',intent);expect(verifyConfirmationToken(t,'u2',intent)).toBe(false)});it('rejects modified intent',()=>{const t=createConfirmationToken('u1',intent);expect(verifyConfirmationToken(t,'u1',{...intent,amount:15001})).toBe(false)});});
