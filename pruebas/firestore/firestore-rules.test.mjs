import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch
} from 'firebase/firestore';

const here = dirname(fileURLToPath(import.meta.url));
const rulesPath = process.env.FIRESTORE_RULES_PATH || resolve(here, '../../firestore.rules');
const rules = await readFile(rulesPath, 'utf8');
const env = await initializeTestEnvironment({
  projectId: 'demo-disenador-rules',
  firestore: { rules }
});
const code = 'ABCDEFGHJKMN';
const nextCode = '23456789ABCD';
const rotateCode = 'HJKMNPQRSTUV';
const invite = (group, token, name = 'Grupo de prueba', teacher = 'teacher') => ({
  grupo: group,
  codigo: token,
  nombre: name,
  maestro: teacher,
  maestroNombre: 'Maestra'
});

try {
  const teacher = env.authenticatedContext('teacher').firestore();
  const student = env.authenticatedContext('student').firestore();
  const pendingTeacher = env.authenticatedContext('pending-teacher').firestore();
  const stranger = env.authenticatedContext('stranger').firestore();
  const unauthenticated = env.unauthenticatedContext().firestore();

  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'grupos/class-a'), {
      nombre: 'Grupo de prueba', codigo: code, maestro: 'teacher', maestroNombre: 'Maestra'
    });
    await setDoc(doc(db, `invitaciones/${code}`), invite('class-a', code));
    await setDoc(doc(db, 'grupos/legacy'), {
      nombre: 'Grupo antiguo', codigo: 'OLD123', maestro: 'teacher', maestroNombre: 'Maestra'
    });
    await setDoc(doc(db, 'usuarios/teacher/grupos/legacy'), { nombre: 'Grupo antiguo', codigo: 'OLD123', rol: 'maestro' });
    await setDoc(doc(db, 'equipos/closed'), { dueno: 'teacher', abierto: false });
    await setDoc(doc(db, 'equipos/closed/objetos/o1'), { texto: 'privado' });
    await setDoc(doc(db, 'equipos/open'), { dueno: 'teacher', abierto: true });
    await setDoc(doc(db, 'equipos/open/objetos/o1'), { texto: 'compartido' });
  });

  // Invite tokens are exact-get only; group documents cannot be enumerated or read by strangers.
  await assertSucceeds(getDoc(doc(student, `invitaciones/${code}`)));
  await assertFails(getDocs(collection(student, 'invitaciones')));
  await assertFails(getDoc(doc(unauthenticated, `invitaciones/${code}`)));
  await assertFails(getDoc(doc(stranger, 'grupos/class-a')));
  await assertFails(getDocs(collection(stranger, 'grupos')));

  // Membership and auxiliary requests are bound to the current group code.
  await assertFails(setDoc(doc(student, 'grupos/class-a/miembros/student'), {
    nombre: 'Alumno', codigo: 'ZZZZZZZZZZZZ'
  }));
  await assertSucceeds(setDoc(doc(student, 'grupos/class-a/miembros/student'), {
    nombre: 'Alumno', correo: '', foto: '', unido: '2026-11-10', codigo: code
  }));
  await assertSucceeds(getDoc(doc(student, 'grupos/class-a')));
  await assertFails(setDoc(doc(pendingTeacher, 'grupos/class-a/auxSolicitudes/pending-teacher'), {
    nombre: 'Auxiliar', correo: '', fecha: '2026-11-10', codigo: 'ZZZZZZZZZZZZ'
  }));
  await assertSucceeds(setDoc(doc(pendingTeacher, 'grupos/class-a/auxSolicitudes/pending-teacher'), {
    nombre: 'Auxiliar', correo: '', fecha: '2026-11-10', codigo: code
  }));
  await assertSucceeds(getDoc(doc(pendingTeacher, 'grupos/class-a')));

  // Group creation and code rotation must atomically include the invite document.
  const createBatch = writeBatch(teacher);
  createBatch.set(doc(teacher, 'grupos/class-new'), {
    nombre: 'Nuevo', codigo: nextCode, maestro: 'teacher', maestroNombre: 'Maestra', creado: '2026-11-10'
  });
  createBatch.set(doc(teacher, `invitaciones/${nextCode}`), invite('class-new', nextCode, 'Nuevo'));
  await assertSucceeds(createBatch.commit());

  const rotateBatch = writeBatch(teacher);
  rotateBatch.update(doc(teacher, 'grupos/legacy'), { codigo: rotateCode });
  rotateBatch.set(doc(teacher, `invitaciones/${rotateCode}`), invite('legacy', rotateCode, 'Grupo antiguo'));
  rotateBatch.update(doc(teacher, 'usuarios/teacher/grupos/legacy'), { codigo: rotateCode });
  await assertSucceeds(rotateBatch.commit());
  await assertFails(getDoc(doc(student, 'grupos/legacy')));
  await assertSucceeds(getDoc(doc(student, `invitaciones/${rotateCode}`)));
  await assertFails(setDoc(doc(stranger, 'grupos/legacy/miembros/stranger'), {
    nombre: 'Intruso', codigo: 'OLD123'
  }));

  // Closing an open team protects its parent and every nested document.
  await assertFails(getDoc(doc(stranger, 'equipos/closed')));
  await assertFails(getDoc(doc(stranger, 'equipos/closed/objetos/o1')));
  await assertSucceeds(getDoc(doc(teacher, 'equipos/closed')));
  await assertSucceeds(getDoc(doc(teacher, 'equipos/closed/objetos/o1')));
  await assertSucceeds(getDoc(doc(stranger, 'equipos/open')));
  await assertSucceeds(getDoc(doc(stranger, 'equipos/open/objetos/o1')));

  console.log('PASS: invitaciones privadas, pertenencia, auxiliares, rotación de código y lectura de equipos');
} finally {
  await env.cleanup();
}
