// import React, { useRef, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   Dimensions,
//   TouchableOpacity,
//   Animated,
//   StatusBar,
// } from 'react-native';
// import { router } from 'expo-router';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { fonts, radius } from '../components/ui/theme';

// const { width, height } = Dimensions.get('window');
// const PHONE_W = width * 0.62;
// const PHONE_H = PHONE_W * 2.05;
// const PHONE_R = PHONE_W * 0.11;

// // ─── Phone frame ────────────────────────────────────────────────────────────

// const FRAME_W = 280;
// const FRAME_H = 560;
// const SIDE_W = 10;       // thickness of the flat aluminum side
// const CORNER_R = 40;
// const SCREEN_R = 36;

// function Phone({ children }: { children: React.ReactNode }) {
//   return (
//     <View style={ph.wrapper}>

//       {/* ── Left side buttons ── */}
//       <View style={[ph.sideBtn, ph.btnLeft, ph.muteSwitchBtn]} />
//       <View style={[ph.sideBtn, ph.btnLeft, ph.volUpBtn]} />
//       <View style={[ph.sideBtn, ph.btnLeft, ph.volDownBtn]} />

//       {/* ── Right side power button ── */}
//       <View style={[ph.sideBtn, ph.btnRight, ph.powerBtn]} />

//       {/* ── Outer aluminum shell ── */}
//       <View style={ph.frame}>

//         {/* Glass screen surface */}
//         <View style={ph.glass}>

//           {/* Notch — deep cutout into bezel */}
//           <View style={ph.notchWrap}>
//             <View style={ph.notch}>
//               <View style={ph.camera} />
//             </View>
//           </View>

//           {/* Status bar */}
//           <View style={ph.statusBar}>
//             <Text style={ph.statusTime}>10:08</Text>
//             <View style={ph.statusRight}>
//               {/* Signal bars */}
//               <View style={ph.signal}>
//                 {[5, 7, 9, 11].map((h, i) => (
//                   <View key={i} style={[ph.sigBar, { height: h }]} />
//                 ))}
//               </View>
//               {/* Battery */}
//               <View style={ph.battery}>
//                 <View style={ph.battFill} />
//                 <View style={ph.battNub} />
//               </View>
//             </View>
//           </View>

//           {/* Screen content */}
//           <View style={ph.screen}>{children}</View>

//           {/* Home indicator — no bottom area, just the thin pill */}
//           <View style={ph.homeBar} />
//         </View>
//       </View>
//     </View>
//   );
// }

// const ph = StyleSheet.create({
//   wrapper: {
//     width: FRAME_W,
//     height: FRAME_H,
//     position: 'relative',
//     alignItems: 'center',
//   },

//   /* ── Buttons sit outside the frame ── */
//   sideBtn: {
//     position: 'absolute',
//     zIndex: 2,
//     borderRadius: 2,
//   },
//   btnLeft: {
//     left: 0,
//     // gradient handled natively via borderColor trick or a View with opacity layers
//     backgroundColor: '#6E6E72',
//     borderLeftColor: '#2A2A2C',
//     borderRightColor: '#3A3A3C',
//     borderLeftWidth: 1,
//     borderRightWidth: 1,
//   },
//   btnRight: {
//     right: 0,
//     backgroundColor: '#6E6E72',
//     borderLeftColor: '#3A3A3C',
//     borderRightColor: '#2A2A2C',
//     borderLeftWidth: 1,
//     borderRightWidth: 1,
//   },
//   muteSwitchBtn: { top: 138, width: 8, height: 26 },
//   volUpBtn:      { top: 178, width: 8, height: 52 },
//   volDownBtn:    { top: 242, width: 8, height: 52 },
//   powerBtn:      { top: 196, width: 8, height: 68 },

//   /* ── Main aluminum frame ── */
//   frame: {
//     position: 'absolute',
//     top: 0,
//     left: SIDE_W,
//     width: FRAME_W - SIDE_W * 2,
//     height: FRAME_H,
//     borderRadius: CORNER_R,
//     backgroundColor: '#1C1C1E',
//     // Simulated flat-edge sides using border
//     borderWidth: SIDE_W,
//     borderColor: '#6A6A6E',     // the bright side face
//     borderTopColor: '#707074',
//     borderBottomColor: '#606064',
//     overflow: 'hidden',
//   },

//   /* ── Glass inset inside frame ── */
//   glass: {
//     flex: 1,
//     borderRadius: SCREEN_R - SIDE_W,
//     backgroundColor: '#0D0D1A',
//     overflow: 'hidden',
//     alignItems: 'center',
//   },

//   /* ── Notch ── */
//   notchWrap: {
//     width: '100%',
//     alignItems: 'center',
//     position: 'absolute',
//     top: 0,
//     zIndex: 10,
//   },
//   notch: {
//     width: '40%',
//     height: 28,
//     backgroundColor: '#090910',
//     borderBottomLeftRadius: 14,
//     borderBottomRightRadius: 14,
//     alignItems: 'flex-end',
//     justifyContent: 'center',
//     paddingRight: 12,
//   },
//   camera: {
//     width: 9,
//     height: 9,
//     borderRadius: 4.5,
//     backgroundColor: '#1A1A22',
//     borderWidth: 1,
//     borderColor: '#0A0A12',
//   },

//   /* ── Status bar ── */
//   statusBar: {
//     width: '100%',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 18,
//     paddingTop: 14,
//     paddingBottom: 6,
//   },
//   statusTime: {
//     color: '#fff',
//     fontSize: 13,
//     fontWeight: '600',
//     letterSpacing: -0.3,
//   },
//   statusRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },

//   signal: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
//   sigBar: { width: 2.5, backgroundColor: '#fff', borderRadius: 0.8 },

//   battery: {
//     width: 22,
//     height: 11,
//     borderRadius: 2.5,
//     borderWidth: 1.3,
//     borderColor: '#fff',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 1.5,
//     position: 'relative',
//   },
//   battFill: { flex: 0.8, height: 6, borderRadius: 1, backgroundColor: '#fff' },
//   battNub: {
//     position: 'absolute',
//     right: -3.5,
//     top: 3,
//     width: 2.5,
//     height: 4,
//     borderRadius: 1.2,
//     backgroundColor: 'rgba(255,255,255,0.5)',
//   },

//   /* ── Screen ── */
//   screen: { flex: 1, width: '100%', overflow: 'hidden' },

//   /* ── Home indicator only — no bottom bar ── */
//   homeBar: {
//     width: '30%',
//     height: 4,
//     borderRadius: 2,
//     backgroundColor: 'rgba(255,255,255,0.55)',
//     marginBottom: 8,
//   },
// });

// // ─── Slide 1 — Instagram time drain ─────────────────────────────────────────

// function Slide1Phone() {
//   return (
//     <Phone>
//       {/* Reels header */}
//       <View style={s1.header}>
//         <Text style={s1.headerTitle}>Reels</Text>
//         <Text style={s1.headerIcon}>⊙</Text>
//       </View>

//       {/* Reel background */}
//       <View style={s1.reelBg}>
//         {/* Silhouette placeholder */}
//         <View style={s1.reelOverlay} />

//         {/* Right sidebar */}
//         <View style={s1.sidebar}>
//           <View style={s1.sideItem}>
//             <Text style={s1.sideIcon}>♡</Text>
//             <Text style={s1.sideCount}>12.1K</Text>
//           </View>
//           <View style={s1.sideItem}>
//             <Text style={s1.sideIcon}>💬</Text>
//             <Text style={s1.sideCount}>342</Text>
//           </View>
//           <View style={s1.sideItem}>
//             <Text style={s1.sideIcon}>➣</Text>
//           </View>
//         </View>

//         {/* Time jump */}
//         <View style={s1.timeWrap}>
//           <View style={s1.timePill}>
//             <Text style={s1.timePillText}>10:08 PM</Text>
//           </View>
//           <View style={s1.arrowWrap}>
//             <Text style={s1.arrowText}>↓</Text>
//           </View>
//           <View style={[s1.timePill, s1.timePillLate]}>
//             <Text style={s1.timePillText}>11:21 PM</Text>
//           </View>
//         </View>

//         {/* Bottom info */}
//         <View style={s1.reelBottom}>
//           <View style={s1.userRow}>
//             <View style={s1.avatar} />
//             <Text style={s1.username}>@exploremore</Text>
//             <View style={s1.followBtn}>
//               <Text style={s1.followText}>Follow</Text>
//             </View>
//           </View>
//           <Text style={s1.caption}>never stop exploring ✨</Text>
//           <View style={s1.audioRow}>
//             <Text style={s1.audioIcon}>♫</Text>
//             <Text style={s1.audioText}>Original Audio</Text>
//           </View>
//         </View>
//       </View>

//       {/* 73 min gone banner */}
//       <View style={s1.goneBanner}>
//         <View style={s1.goneIcon}>
//           <Text style={s1.goneIconText}>🕐</Text>
//         </View>
//         <View>
//           <Text style={s1.goneTitle}>73 minutes gone</Text>
//           <Text style={s1.goneDay}>Today</Text>
//         </View>
//       </View>
//     </Phone>
//   );
// }

// const s1 = StyleSheet.create({
//   header: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     paddingHorizontal: '6%', paddingVertical: '3%',
//     backgroundColor: 'rgba(0,0,0,0.4)', position: 'absolute',
//     top: 0, left: 0, right: 0, zIndex: 3,
//   },
//   headerTitle: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.042, color: '#fff' },
//   headerIcon: { fontSize: PHONE_W * 0.042, color: '#fff' },
//   reelBg: {
//     flex: 1,
//     backgroundColor: '#1a0a00',
//     justifyContent: 'flex-end',
//   },
//   reelOverlay: {
//     position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
//     backgroundColor: 'rgba(80,40,10,0.5)',
//   },
//   sidebar: {
//     position: 'absolute', right: '4%', bottom: PHONE_H * 0.12,
//     alignItems: 'center', gap: 14,
//   },
//   sideItem: { alignItems: 'center' },
//   sideIcon: { fontSize: PHONE_W * 0.055, color: '#fff' },
//   sideCount: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.025, color: '#fff', marginTop: 2 },
//   timeWrap: {
//     position: 'absolute', left: '6%', top: '18%',
//     alignItems: 'flex-start', gap: 4,
//   },
//   timePill: {
//     backgroundColor: 'rgba(20,20,20,0.85)',
//     borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
//   },
//   timePillLate: { backgroundColor: 'rgba(20,20,20,0.95)' },
//   timePillText: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.038, color: '#fff' },
//   arrowWrap: { paddingLeft: 14 },
//   arrowText: { fontSize: PHONE_W * 0.04, color: 'rgba(255,255,255,0.6)' },
//   reelBottom: {
//     paddingHorizontal: '6%', paddingBottom: '3%', gap: 4,
//   },
//   userRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
//   avatar: {
//     width: PHONE_W * 0.08, height: PHONE_W * 0.08,
//     borderRadius: 100, backgroundColor: '#888',
//     borderWidth: 1.5, borderColor: '#fff',
//   },
//   username: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.032, color: '#fff' },
//   followBtn: {
//     borderWidth: 1, borderColor: '#fff', borderRadius: 5,
//     paddingHorizontal: 8, paddingVertical: 2,
//   },
//   followText: { fontFamily: fonts.medium, fontSize: PHONE_W * 0.026, color: '#fff' },
//   caption: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.03, color: '#fff' },
//   audioRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
//   audioIcon: { fontSize: PHONE_W * 0.03, color: '#fff' },
//   audioText: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.028, color: '#fff' },
//   goneBanner: {
//     flexDirection: 'row', alignItems: 'center', gap: 10,
//     backgroundColor: '#1E1B4B', paddingHorizontal: '5%', paddingVertical: '3%',
//   },
//   goneIcon: {
//     width: PHONE_W * 0.1, height: PHONE_W * 0.1,
//     borderRadius: 10, backgroundColor: '#4C1D95',
//     alignItems: 'center', justifyContent: 'center',
//   },
//   goneIconText: { fontSize: PHONE_W * 0.05 },
//   goneTitle: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.038, color: '#fff' },
//   goneDay: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.028, color: '#888' },
// });

// // ─── Slide 2 — Notification overload ────────────────────────────────────────

// function Slide2Phone() {
//   const notifs = [
//     { icon: 'I', iconBg: '#E1306C', app: 'Instagram', msg: '✨ New reel from your favorite creator', time: 'now' },
//     { icon: 'Y', iconBg: '#FF0000', app: 'YouTube', msg: '🔴 Watch this video now!', time: '5m ago' },
//     { icon: 'X', iconBg: '#000', app: 'X', msg: "What's happening?", time: '12m ago' },
//   ];

//   const interrupted = [
//     { icon: '📖', label: 'Studying' },
//     { icon: '💼', label: 'Working' },
//     { icon: '🌙', label: 'Sleeping' },
//   ];

//   return (
//     <Phone>
//       <View style={s2.root}>
//         {/* Notification list */}
//         {notifs.map((n, i) => (
//           <View key={i} style={s2.notifRow}>
//             <View style={[s2.notifIcon, { backgroundColor: n.iconBg }]}>
//               <Text style={s2.notifIconText}>{n.icon}</Text>
//             </View>
//             <View style={s2.notifBody}>
//               <View style={s2.notifTop}>
//                 <Text style={s2.notifApp}>{n.app}</Text>
//                 <Text style={s2.notifTime}>{n.time}</Text>
//               </View>
//               <Text style={s2.notifMsg} numberOfLines={1}>{n.msg}</Text>
//             </View>
//           </View>
//         ))}

//         {/* Divider */}
//         <View style={s2.divider} />

//         {/* Interrupted rows */}
//         {interrupted.map((item, i) => (
//           <View key={i} style={s2.interruptRow}>
//             <View style={s2.interruptIcon}>
//               <Text style={s2.interruptEmoji}>{item.icon}</Text>
//             </View>
//             <View style={s2.interruptBody}>
//               <Text style={s2.interruptLabel}>{item.label}</Text>
//               <Text style={s2.interruptSub}>Interrupted</Text>
//             </View>
//             <Text style={s2.interruptX}>✕</Text>
//           </View>
//         ))}
//       </View>
//     </Phone>
//   );
// }

// const s2 = StyleSheet.create({
//   root: { flex: 1, backgroundColor: '#0D0D1A', paddingTop: '4%' },
//   notifRow: {
//     flexDirection: 'row', alignItems: 'center',
//     paddingHorizontal: '5%', paddingVertical: '3%',
//     borderBottomWidth: 1, borderBottomColor: '#1E1E2E',
//     gap: '3%',
//   },
//   notifIcon: {
//     width: PHONE_W * 0.1, height: PHONE_W * 0.1,
//     borderRadius: 12, alignItems: 'center', justifyContent: 'center',
//   },
//   notifIconText: { fontFamily: fonts.bold, fontSize: PHONE_W * 0.045, color: '#fff' },
//   notifBody: { flex: 1 },
//   notifTop: { flexDirection: 'row', justifyContent: 'space-between' },
//   notifApp: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.032, color: '#fff' },
//   notifTime: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.026, color: '#666' },
//   notifMsg: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.028, color: '#999', marginTop: 2 },
//   divider: { height: 1, backgroundColor: '#1E1E2E', marginVertical: '3%' },
//   interruptRow: {
//     flexDirection: 'row', alignItems: 'center',
//     paddingHorizontal: '5%', paddingVertical: '3%',
//     gap: '3%',
//   },
//   interruptIcon: {
//     width: PHONE_W * 0.1, height: PHONE_W * 0.1,
//     borderRadius: 12, backgroundColor: '#1E1E2E',
//     alignItems: 'center', justifyContent: 'center',
//   },
//   interruptEmoji: { fontSize: PHONE_W * 0.045 },
//   interruptBody: { flex: 1 },
//   interruptLabel: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.034, color: '#fff' },
//   interruptSub: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.026, color: '#666', marginTop: 2 },
//   interruptX: { fontSize: PHONE_W * 0.04, color: '#EF4444' },
// });

// // ─── Slide 3 — My Limits ─────────────────────────────────────────────────────

// function Slide3Phone() {
//   const apps = [
//     { icon: 'I', iconBg: '#E1306C', name: 'Instagram', sub: '45m used', limit: '1h / day', bar: 0.75, barColor: '#22C55E', badge: null },
//     { icon: 'Y', iconBg: '#FF0000', name: 'YouTube',   sub: '20m used', limit: '45m / day', bar: 0.44, barColor: '#22C55E', badge: null },
//     { icon: 'T', iconBg: '#000',    name: 'TikTok',    sub: null,       limit: '30m / day', bar: 1,    barColor: '#EF4444', badge: 'Limit reached' },
//     { icon: 'X', iconBg: '#111',    name: 'X (Twitter)', sub: 'Work hours 9 AM - 6 PM', limit: null, bar: 0, barColor: '#EF4444', badge: 'Blocked' },
//     { icon: 'S', iconBg: '#FFFC00', name: 'Snapchat',  sub: 'Time window  Today', limit: '1 PM - 2 PM', bar: 0, barColor: '#888', badge: null },
//   ];

//   return (
//     <Phone>
//       <View style={s3.root}>
//         {/* Header */}
//         <View style={s3.header}>
//           <Text style={s3.back}>{'<'}</Text>
//           <Text style={s3.headerTitle}>My Limits</Text>
//           <Text style={s3.crown}>👑</Text>
//         </View>

//         {/* App rules */}
//         {apps.map((app, i) => (
//           <View key={i} style={s3.appRow}>
//             <View style={[s3.appIcon, { backgroundColor: app.iconBg }]}>
//               <Text style={s3.appIconText}>{app.icon}</Text>
//             </View>
//             <View style={s3.appBody}>
//               <View style={s3.appTop}>
//                 <Text style={s3.appName}>{app.name}</Text>
//                 {app.limit && !app.badge && (
//                   <Text style={s3.appLimit}>{app.limit}</Text>
//                 )}
//                 {app.badge && (
//                   <Text style={[s3.appBadge, { color: app.badge === 'Blocked' ? '#EF4444' : '#EF4444' }]}>
//                     {app.badge}
//                   </Text>
//                 )}
//               </View>
//               {app.sub && <Text style={s3.appSub}>{app.sub}</Text>}
//               {app.bar > 0 && (
//                 <View style={s3.barBg}>
//                   <View style={[s3.barFill, { width: `${app.bar * 100}%`, backgroundColor: app.barColor }]} />
//                 </View>
//               )}
//             </View>
//           </View>
//         ))}

//         {/* Locked sheet */}
//         <View style={s3.sheet}>
//           <Text style={s3.lockIcon}>🔒</Text>
//           <Text style={s3.sheetTitle}>Instagram Locked</Text>
//           <Text style={s3.sheetSub}>Available again at 7:00 PM</Text>
//           <View style={s3.countdown}>
//             <View style={s3.countUnit}>
//               <Text style={s3.countNum}>02</Text>
//               <Text style={s3.countLabel}>HRS</Text>
//             </View>
//             <Text style={s3.countSep}>:</Text>
//             <View style={s3.countUnit}>
//               <Text style={s3.countNum}>15</Text>
//               <Text style={s3.countLabel}>MINS</Text>
//             </View>
//             <Text style={s3.countSep}>:</Text>
//             <View style={s3.countUnit}>
//               <Text style={s3.countNum}>32</Text>
//               <Text style={s3.countLabel}>SECS</Text>
//             </View>
//           </View>
//           <View style={s3.actionRow}>
//             <View style={s3.waitBtn}>
//               <Text style={s3.waitBtnText}>⏳  Wait 4:32{'\n'}Free</Text>
//             </View>
//             <View style={s3.unlockBtn}>
//               <Text style={s3.unlockBtnText}>🔓  Unlock now{'\n'}$5</Text>
//             </View>
//           </View>
//         </View>
//       </View>
//     </Phone>
//   );
// }

// const s3 = StyleSheet.create({
//   root: { flex: 1, backgroundColor: '#0D0D1A' },
//   header: {
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
//     paddingHorizontal: '5%', paddingVertical: '3%',
//     borderBottomWidth: 1, borderBottomColor: '#1E1E2E',
//   },
//   back: { fontFamily: fonts.medium, fontSize: PHONE_W * 0.04, color: '#888' },
//   headerTitle: { fontFamily: fonts.bold, fontSize: PHONE_W * 0.038, color: '#fff' },
//   crown: { fontSize: PHONE_W * 0.04 },
//   appRow: {
//     flexDirection: 'row', alignItems: 'center',
//     paddingHorizontal: '5%', paddingVertical: '2.5%',
//     gap: '3%',
//   },
//   appIcon: {
//     width: PHONE_W * 0.09, height: PHONE_W * 0.09,
//     borderRadius: 10, alignItems: 'center', justifyContent: 'center',
//   },
//   appIconText: { fontFamily: fonts.bold, fontSize: PHONE_W * 0.038, color: '#fff' },
//   appBody: { flex: 1 },
//   appTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   appName: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.03, color: '#fff' },
//   appLimit: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.026, color: '#888' },
//   appBadge: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.026 },
//   appSub: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.025, color: '#666', marginTop: 1 },
//   barBg: {
//     height: 3, backgroundColor: '#2A2A3A', borderRadius: 2, marginTop: 4,
//   },
//   barFill: { height: 3, borderRadius: 2 },
//   sheet: {
//     position: 'absolute', bottom: 0, left: 0, right: 0,
//     backgroundColor: '#13131F',
//     borderTopWidth: 1, borderTopColor: '#2A2A3A',
//     paddingHorizontal: '5%', paddingVertical: '4%',
//     alignItems: 'center',
//   },
//   lockIcon: { fontSize: PHONE_W * 0.07, marginBottom: '2%' },
//   sheetTitle: { fontFamily: fonts.bold, fontSize: PHONE_W * 0.038, color: '#fff' },
//   sheetSub: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.026, color: '#888', marginTop: 2, marginBottom: '3%' },
//   countdown: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: '4%' },
//   countUnit: { alignItems: 'center' },
//   countNum: { fontFamily: fonts.bold, fontSize: PHONE_W * 0.06, color: '#fff' },
//   countLabel: { fontFamily: fonts.regular, fontSize: PHONE_W * 0.022, color: '#666' },
//   countSep: { fontFamily: fonts.bold, fontSize: PHONE_W * 0.055, color: '#444', marginBottom: 10 },
//   actionRow: { flexDirection: 'row', gap: '3%', width: '100%' },
//   waitBtn: {
//     flex: 1, backgroundColor: '#16A34A',
//     borderRadius: 10, paddingVertical: '4%', alignItems: 'center',
//   },
//   waitBtnText: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.03, color: '#fff', textAlign: 'center', lineHeight: PHONE_W * 0.042 },
//   unlockBtn: {
//     flex: 1, backgroundColor: '#5C6EFF',
//     borderRadius: 10, paddingVertical: '4%', alignItems: 'center',
//   },
//   unlockBtnText: { fontFamily: fonts.semiBold, fontSize: PHONE_W * 0.03, color: '#fff', textAlign: 'center', lineHeight: PHONE_W * 0.042 },
// });

// // ─── Slide data ──────────────────────────────────────────────────────────────

// const SLIDE_BG = ['#0D0D1A', '#0D0D1A', '#0A1A0D'];

// const SLIDES = [
//   {
//     id: '1',
//     accent: '#7C5CFF',
//     bg: '#0D0D1A',
//     titleParts: [
//       { text: 'Ever opened an app\nfor 5 minutes... ', color: '#fff' },
//       { text: 'and lost an hour?', color: '#7C5CFF' },
//     ],
//     subParts: [
//       { text: 'Apps are designed to keep you scrolling. ', color: '#9CA3AF' },
//       { text: 'Screenly', color: '#7C5CFF' },
//       { text: ' helps you take back control.', color: '#9CA3AF' },
//     ],
//     visual: <Slide1Phone />,
//   },
//   {
//     id: '2',
//     accent: '#7C5CFF',
//     bg: '#0D0D1A',
//     titleParts: [
//       { text: 'We know self-control\nis ', color: '#fff' },
//       { text: 'really hard.', color: '#7C5CFF' },
//     ],
//     subParts: [
//       { text: 'Notifications, reels, and endless feeds\nconstantly pull your attention away.', color: '#9CA3AF' },
//     ],
//     visual: <Slide2Phone />,
//   },
//   {
//     id: '3',
//     accent: '#22C55E',
//     bg: '#0A1A0D',
//     titleParts: [
//       { text: 'Screenly can help you\n', color: '#fff' },
//       { text: 'optimize your\nphone usage.', color: '#22C55E' },
//     ],
//     subParts: [
//       { text: 'Define time windows or max usage for your apps and we don\'t let you go over.\nIt\'s urgent? You can ', color: '#9CA3AF' },
//       { text: 'unlock it with just $5.', color: '#22C55E' },
//     ],
//     visual: <Slide3Phone />,
//   },
// ];

// // ─── Main screen ─────────────────────────────────────────────────────────────

// export default function OnboardingScreen() {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const flatListRef = useRef<FlatList>(null);
//   const scrollX = useRef(new Animated.Value(0)).current;

//   async function finish() {
//     await AsyncStorage.setItem('onboarding_done', '1');
//     router.replace('/(auth)/sign-in');
//   }

//   function next() {
//     if (currentIndex < SLIDES.length - 1) {
//       flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
//     } else {
//       finish();
//     }
//   }

//   const isLast = currentIndex === SLIDES.length - 1;
//   const current = SLIDES[currentIndex];

//   return (
//     <View style={[styles.root, { backgroundColor: current.bg }]}>
//       <StatusBar barStyle="light-content" />

//       {!isLast && (
//         <TouchableOpacity style={styles.skip} onPress={finish}>
//           <Text style={styles.skipText}>Skip</Text>
//         </TouchableOpacity>
//       )}

//       <Animated.FlatList
//         ref={flatListRef}
//         data={SLIDES}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         keyExtractor={item => item.id}
//         onScroll={Animated.event(
//           [{ nativeEvent: { contentOffset: { x: scrollX } } }],
//           { useNativeDriver: false }
//         )}
//         onMomentumScrollEnd={e => {
//           setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
//         }}
//         renderItem={({ item }) => (
//           <View style={[styles.slide, { width, backgroundColor: item.bg }]}>
//             <View style={styles.visualWrap}>
//               {item.visual}
//             </View>
//             <View style={styles.textBlock}>
//               <Text style={styles.title}>
//                 {item.titleParts.map((p: { text: string; color: string }, i: number) => (
//                   <Text key={i} style={{ color: p.color }}>{p.text}</Text>
//                 ))}
//               </Text>
//               <Text style={styles.sub}>
//                 {item.subParts.map((p: { text: string; color: string }, i: number) => (
//                   <Text key={i} style={{ color: p.color }}>{p.text}</Text>
//                 ))}
//               </Text>
//             </View>
//           </View>
//         )}
//       />

//       {/* Dots + CTA */}
//       <View style={[styles.footer, { backgroundColor: current.bg }]}>
//         <View style={styles.dots}>
//           {SLIDES.map((_, i) => {
//             const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
//             const dotWidth = scrollX.interpolate({ inputRange, outputRange: [6, 20, 6], extrapolate: 'clamp' });
//             const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
//             return (
//               <Animated.View
//                 key={i}
//                 style={[styles.dot, { width: dotWidth, opacity, backgroundColor: current.accent }]}
//               />
//             );
//           })}
//         </View>

//         <TouchableOpacity
//           style={[styles.cta, { backgroundColor: current.accent }]}
//           onPress={next}
//           activeOpacity={0.85}
//         >
//           <Text style={styles.ctaText}>{isLast ? 'Get Started' : 'Continue'}</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1 },
//   skip: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
//   skipText: { fontFamily: fonts.medium, fontSize: 14, color: '#9CA3AF' },
//   slide: {
//     flex: 1,
//     paddingHorizontal: 24,
//     paddingTop: 56,
//     alignItems: 'center',
//   },
//   visualWrap: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   textBlock: {
//     paddingBottom: 12,
//     alignItems: 'center',
//     width: '100%',
//   },
//   title: {
//     fontFamily: fonts.bold,
//     fontSize: 24,
//     textAlign: 'center',
//     lineHeight: 32,
//     marginBottom: 10,
//   },
//   sub: {
//     fontFamily: fonts.regular,
//     fontSize: 14,
//     textAlign: 'center',
//     lineHeight: 21,
//   },
//   footer: {
//     paddingHorizontal: 24,
//     paddingBottom: 48,
//     paddingTop: 12,
//     gap: 16,
//     alignItems: 'center',
//   },
//   dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
//   dot: { height: 6, borderRadius: radius.full },
//   cta: {
//     width: '100%', paddingVertical: 16,
//     borderRadius: 14, alignItems: 'center',
//   },
//   ctaText: { fontFamily: fonts.semiBold, fontSize: 16, color: '#fff' },
// });
