---
sidebar_position: 5
---

# Testing

## Principio

I test non sono una fase separata dello sviluppo: sono parte integrante del codice. Un blocco di logica senza test non è finito — è una bozza.

## Tipi di test

**Test di integrazione** — testano il comportamento del sistema attraverso i suoi confini reali: database, API, file system. Sono i test più importanti perché verificano che i pezzi funzionino insieme. Si usano database reali, non mock.

**Test unitari** — testano una singola unità di logica in isolamento. Si usano quando la logica è complessa e il test di integrazione da solo non dà abbastanza granularità. Non si scrivono test unitari per coprire codice banale.

**Test end-to-end** — testano flussi completi dall'interfaccia utente all'infrastruttura. Costosi da mantenere: si usano solo per i percorsi critici.

## Regole

**Non si mocka il database nei test di integrazione.** I mock danno falsa sicurezza: il test passa, ma il sistema in produzione può fallire per ragioni che il mock non intercetta — constraint, transazioni, comportamenti specifici del motore. Si usa sempre un database reale, identico a quello di produzione per tipo e configurazione. Con Entity Framework Code First, il database di test si inizializza applicando le migration sui sorgenti: stessa struttura, stessi vincoli, zero scostamenti.

**Un caso d'uso, almeno un test.** La business logic non si considera completata finché non esiste almeno un test per ogni caso d'uso, inclusi i casi eccezionali rilevanti. Vale per il percorso principale e per i fallimenti che il sistema deve gestire esplicitamente.

**I test sono codice di produzione.** Si applicano le stesse regole di qualità: leggibilità, manutenibilità, nessuna logica duplicata. Un test difficile da leggere è un test che non si capirà quando fallirà.

**I test devono essere deterministici.** Un test che passa a volte e fallisce altre è peggio di nessun test: introduce rumore e toglie fiducia alla CI. Se un test è flaky, si risolve il problema — non si ritenta.

**La CI è il guardiano.** Nessuna modifica arriva in produzione senza aver passato la suite di test completa. Se la CI è rotta, blocca tutto: nessun workaround, nessuna eccezione.

## Test verticali: servizi e casi d'uso

I test di integrazione possono essere scritti a due livelli, entrambi validi:

**Verticale sul servizio** — testa un singolo servizio di dominio in isolamento, senza passare dal caso d'uso. Utile quando la logica del servizio è complessa e merita una copertura granulare. Il `SaveChanges()` viene chiamato nel test stesso, perché il servizio non lo fa.

**Verticale sul caso d'uso** — testa il flusso completo: dal command al `SaveChanges()`, passando per tutti i servizi coinvolti. È il test più rappresentativo del comportamento reale del sistema.

Entrambi i livelli sono utili e non si escludono. Un caso d'uso ben coperto a livello di test di integrazione non elimina il valore di test più granulari sui servizi con logica complessa.

## Generazione di test con l'IA

Quando il modello di dominio è scritto in Entity Framework Code First e i casi d'uso sono documentati, l'IA ha tutto il contesto per generare test di integrazione significativi: conosce le entità, le relazioni, i vincoli e il comportamento atteso.

Questo non sostituisce il ragionamento del developer sui casi limite, ma abbassa drasticamente il costo di bootstrapping — il test generato è un punto di partenza solido, non un template vuoto.

## Coverage

Il coverage è un indicatore, non un obiettivo. Un coverage alto su codice banale è rumore. Un coverage basso su business logic critica è un rischio.

L'obiettivo è coprire ogni **comportamento significativo**, non ogni riga. La domanda giusta non è "quanto codice è coperto?" ma "cosa succederebbe se questa logica fosse sbagliata e non lo sapessi?".