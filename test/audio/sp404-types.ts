import tools, {
  DataBuffer,
  SP404PadInfo,
  SP404Pattern,
  type SP404Note,
  type SP404Pad,
  type SP404PadInput,
  type SP404PadMapping,
  type SP404PatternOptions,
  type SP404ToMidiOptions,
} from "@uttori/data-tools";
import PublicPadInfo from "@uttori/data-tools/audio/sp404-padinfo";
import PublicPattern from "@uttori/data-tools/audio/sp404-pattern";

/** Compile-only consumer fixture covering root exports, subpaths, and the renamed public types. */
function checkPublicTypes(): void {
  const input: SP404PadInput = { channels: 2, tempoMode: 0, lofi: false };
  const pad: SP404Pad = PublicPadInfo.fromFile(SP404PadInfo.encodePad(input)).pads[0];
  SP404PadInfo.checkDefault(pad, true);
  const options: SP404PatternOptions = { og: true, padsPerBank: 12 };
  const pattern: SP404Pattern = new PublicPattern(undefined, options);
  const mapping: SP404PadMapping = pattern.defaultMap.A1;
  const midiOptions: SP404ToMidiOptions = { noteMap: { [mapping.pad]: 0 } };
  const midi = pattern.toMidi(midiOptions);
  const output: DataBuffer = tools.SP404Pattern.fromMidi(midi, { 0: "A1" }, 96, true);
  const notes: SP404Note[] = new SP404Pattern(output, options).notes;
  void notes;
  tools.SP404PadInfo.encodePad(pad);

  // The included MIDI API accepts numeric note values, preventing legacy string-note conversions.
  // @ts-expect-error MIDI note mappings must contain numbers.
  pattern.toMidi({ noteMap: { A1: "60" } });
  // @ts-expect-error Flag inputs do not accept strings.
  SP404PadInfo.encodePad({ lofi: "on" });
}

void checkPublicTypes;
