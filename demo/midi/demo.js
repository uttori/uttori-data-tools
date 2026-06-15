import AudioMIDI from '../src/index.js';

const makeDetail = (key, value, keyClass = '', valueClass = '') => {
  const detail = document.createElement('div');
  detail.className ='detail';
  const keyNode = document.createElement('div');
  keyNode.className = `key ${keyClass}`;
  keyNode.textContent = key;
  const valueNode = document.createElement('div');
  valueNode.className = `value ${valueClass}`;
  valueNode.textContent = value;
  detail.append(keyNode);
  detail.append(valueNode);
  return detail;
};

// A helper to display the main MIDI header info
function renderMidiDetails(midiParser) {
  const detailsContainer = document.querySelector('.chunk-list');
  if (detailsContainer) {
    detailsContainer.innerHTML = '';
    const detail = document.createElement('div');
    detail.className = 'chunk midi-detail';

    detail.append(makeDetail('MIDI Format', midiParser.format));
    detail.append(makeDetail('Track Count', midiParser.trackCount));
    detail.append(makeDetail('Time Division', midiParser.timeDivision));
    detailsContainer.append(detail);
  }
}

// A helper to display validation issues in the DOM
function renderValidationIssues(issues) {
  const container = document.querySelector('.chunk-list');
  if (container) {
    if (!issues || issues.length === 0) {
      return;
    }
    const issuesItem = document.createElement('div');
    issuesItem.className = 'chunk midi-detail';
    issuesItem.append(makeDetail('Validation Issues:', issues.length));
    issues.forEach((issue) => {
      issuesItem.appendChild(makeDetail('', issue));
    });
    container.appendChild(issuesItem);
  }
}

const known = [
  'MThd',
  'MTrk',
  'Channel Prefix',
  'Controller',
  'Copyright Notice',
  'Cue Point',
  'Device (Port) Name',
  'End of Track',
  'Instrument Name',
  'Key Signature',
  'Key Signature',
  'Lyrics',
  'M-Live Tag',
  'Marker',
  'MIDI Port',
  'Program Name',
  'Program Change',
  'Sequence / Track Name',
  'Sequence Number',
  'Set Tempo',
  'SMPTE Offset',
  'Song Position Pointer',
  'Song Position Pointer',
  'System Common Messages - EOX',
  'System Common Messages - Tune Request',
  'System Real Time Messages - Active Sensing',
  'System Real Time Messages - Continue',
  'System Real Time Messages - MIDI Clock',
  'System Real Time Messages - Start',
  'System Real Time Messages - Stop',
  'Tempo',
  'Text Event',
  'Time Signature',
];
const labelType = 'Chunk Type:';

const renderEvent = (event, index) => {
  const chunkNode = document.createElement('div');
  chunkNode.className ='chunk event';

  //  Basic Info
  chunkNode.append(makeDetail('Event Label', event.label ?? 'N/A', '', known.includes(event.label) ? 'known' : 'unknown'));
  chunkNode.append(makeDetail('Event Index', index));

  // High-level info
  chunkNode.append(makeDetail('Delta Time', event.deltaTime));
  chunkNode.append(makeDetail('Event Type', `0x${(event.type || 0).toString(16).toUpperCase()}`));

  // If it's a meta event, show meta info
  if (event.type === 0xFF) {
    chunkNode.append(makeDetail('Meta Type', `0x${(event.metaType || 0).toString(16).toUpperCase()}`));
    chunkNode.append(makeDetail('Meta Event Length', event.metaEventLength));
  }

  // Show whatever else might be interesting in .data
  // (except for big note on/off data)
  if (event.data) {
    chunkNode.append(makeDetail('Event Data', JSON.stringify(event.data)));
  }

  document.querySelector('.chunk-list').append(chunkNode);
}

const renderChunk = (chunk, index) => {
  const chunkNode = document.createElement('div');
  chunkNode.className ='chunk';

  //  Basic Info
  chunkNode.append(makeDetail(labelType, chunk.type, '', known.includes(chunk.type) ? 'known' : 'unknown'));
  chunkNode.append(makeDetail('Chunk Index', index));
  chunkNode.append(makeDetail('Chunk Length', chunk.chunkLength));
  if (chunk.events) {
    chunkNode.append(makeDetail('Total Events', chunk.events.length));
  }
  document.querySelector('.chunk-list').append(chunkNode);

  // If it's a track chunk, loop over the events, skipping raw note events
  if (chunk.type === 'MTrk' && Array.isArray(chunk.events)) {
    const filtered = chunk.events.filter((event) => {
      // Exclude note on/off
      const type = (event.type >> 4) & 0x0F;
      const isNoteOn = (type === 0x9 && event.data?.velocity > 0);
      const isNoteOff = (type === 0x8) || (type === 0x9 && event.data?.velocity === 0);
      return !isNoteOn && !isNoteOff;
    });


    filtered.forEach(renderEvent);
  }
};

const outputChunks = (data) => {
  const { chunks } = data;
  chunks.forEach((chunk) => {
    console.log('Chunk:', chunk);
    renderChunk(chunk);
  });
};

document.querySelector('#midi-file').addEventListener('change', (e) => {
  const { files } = e.target;
  if (!files || files.length < 1) {
      return;
  }
  const [file] = files;
  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    if (event?.target?.result) {
      if (document.querySelector('.chunk-list')) {
        document.querySelector('.chunk-list').innerHTML = '';
      }

      const output = new AudioMIDI(event.target.result);
      output.parse();
      renderMidiDetails(output);
      const issues = output.validate() || [];
      renderValidationIssues(issues);
      outputChunks(output);
    }
  });
  reader.readAsArrayBuffer(file);
});
