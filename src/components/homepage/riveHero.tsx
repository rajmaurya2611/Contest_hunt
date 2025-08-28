// import  { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';

// const SM = 'State Machine 1';
// const ART_W = 1080; // <-- your artboard width from Rive editor
// const ART_H = 1080; // <-- your artboard height from Rive editor

// export default function RiveHero() {
//   const { rive, RiveComponent } = useRive({
//     src: '/redigen.riv',
//     stateMachines: SM,
//     autoplay: true,
//     layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
//   });

//   const mouseX = useStateMachineInput(rive, SM, 'Mouse X', 0);
//   const mouseY = useStateMachineInput(rive, SM, 'Mouse Y', 0);
//   const click  = useStateMachineInput(rive, SM, 'Click') as { value?: boolean; fire?: () => void } | null;

//   const onPointerMove: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
//     if (!mouseX || !mouseY) return;
//     const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
//     const viewW = rect.width, viewH = rect.height;
//     const scale = Math.max(viewW / ART_W, viewH / ART_H); // Cover
//     const contentW = ART_W * scale;
//     const contentH = ART_H * scale;
//     const ox = (viewW - contentW) / 2;
//     const oy = (viewH - contentH) / 2;

//     // Normalize inside the drawn content rect (0..1), then map to 0..100
//     const nx = (e.clientX - rect.left - ox) / contentW;
//     const ny = (e.clientY - rect.top  - oy) / contentH;

//     // Clamp and map to your SM range
//     mouseX.value = Math.max(0, Math.min(1, nx)) * 100;
//     mouseY.value = Math.max(0, Math.min(1, ny)) * 100;
//   };

//   return (
//     <RiveComponent
//       style={{ width: '100%', height: '100vh', touchAction: 'none', cursor: 'pointer' }}
//       onPointerMove={onPointerMove}
//       onPointerDown={() => { if (click && 'fire' in click) (click as any).fire(); else if (click) click.value = true; }}
//       onPointerUp={() => { if (click && 'value' in click) (click as any).value = false; }}
//     />
//   );
// }
