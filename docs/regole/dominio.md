---
sidebar_position: 1
---

# Regole sul Dominio

## Decisioni long-term

Le decisioni sul dominio hanno un impatto a lungo termine su tutto il sistema. Il margine di errore deve essere minimo, preferibilmente nullo.

Prima di introdurre o modificare qualsiasi concetto del dominio è necessaria un'analisi approfondita: un errore in questa fase si propaga in ogni strato del software e diventa costoso da correggere nel tempo.

## Ubiquitous Language

Se una cosa ha un nome nel dominio, quel nome deve essere usato ovunque nel codice: variabili, funzioni, classi, tabelle, API. Non si inventano sinonimi, non si abbrevia per comodità, non si traduce. Gli acronimi si evitano salvo che siano loro stessi il termine di dominio riconosciuto da tutti.

Il linguaggio del dominio è l'unico linguaggio del codice.

### Lingua del dominio e lingua della documentazione

Il dominio può essere in inglese — spesso lo è, soprattutto in contesti internazionali o con terminologia tecnica consolidata. La documentazione può essere in italiano. Le due cose non si mescolano: i termini di dominio si lasciano nella loro lingua originale anche all'interno di testo in italiano.

### Glossario

Per progetti con terminologia complessa o specialistica, il glossario è obbligatorio. Non tutti i membri del team — developer, analisti, stakeholder — hanno la stessa familiarità con il dominio. Il glossario chiarisce:

- il significato preciso di ogni termine rilevante
- eventuali sinonimi accettati (e quale forma è preferita nel codice)
- termini che sembrano simili ma hanno significati distinti

Il glossario vive nella documentazione del progetto, non in un documento esterno. Va aggiornato ogni volta che si introduce un nuovo concetto nel dominio.

## Correttezza dei dati

I dati nel dominio si danno per scontati come corretti. Scrivere codice difensivo che mette in dubbio la loro integrità è un segnale che il modello non è adeguato.

Il dominio va modellato in modo che sia difficile — preferibilmente impossibile — inserire dati inconsistenti. A tal fine si privilegiano le funzionalità native del database: **chiavi esterne** e **constraint**. L'integrità si garantisce a livello strutturale, non applicativo.

## Stabilità dei nomi e dei significati

Nel dominio non si rinomina e non si cambia il significato a nulla.

Quando un concetto diventa obsoleto o viene sostituito, si preferisce marcarlo come **deprecato** piuttosto che modificarlo o rimuoverlo. Questo preserva la leggibilità della storia del sistema e la compatibilità con tutto ciò che già lo usa.

Questa regola ha una ragione operativa precisa: in produzione il database viene aggiornato prima del software. Il software nella versione precedente deve continuare a funzionare con il database nella versione nuova. Rinominare o cambiare il significato di una colonna rompe il software che la usa ancora con il vecchio nome — è per definizione un breaking change. Aggiungere e deprecare non lo è. Vedi [`regole/entity-framework`](entity-framework.md).
