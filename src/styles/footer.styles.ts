import { StyleSheet } from 'react-native';
import { colors } from './home.styles';

export const footerStyles = StyleSheet.create({
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5edf3',
    width: '100%',
  },
  footerInner: {
    width: '100%',
    maxWidth: 1820,
    alignSelf: 'center',
    paddingHorizontal: 44,
    paddingTop: 40,
    paddingBottom: 28,
  },
  footerInnerPhone: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 28,
  },
  footerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 36,
  },
  footerMainPhone: {
    flexDirection: 'column',
    gap: 36,
  },
  brandColumn: {
    maxWidth: 380,
    flexShrink: 1,
  },
  brandColumnPhone: {
    maxWidth: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  brandRowPhone: {
    gap: 10,
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#f0f6fb',
    borderWidth: 1,
    borderColor: '#dfebf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkPhone: {
    width: 42,
    height: 42,
    borderRadius: 13,
  },
  brandLogo: {
    width: 36,
    height: 36,
  },
  brandLogoPhone: {
    width: 30,
    height: 30,
  },
  brandName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  brandNamePhone: {
    fontSize: 18,
  },
  brandAccent: {
    color: colors.blue,
  },
  brandTagline: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 1,
  },
  brandDescription: {
    color: '#718092',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 18,
    fontWeight: '400',
  },
  brandDescriptionPhone: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 14,
  },
  linksGroup: {
    flexDirection: 'row',
    gap: 48,
    flexWrap: 'wrap',
  },
  linksGroupPhone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'nowrap',
  },
  linkColumn: {
    minWidth: 120,
  },
  linkColumnPhone: {
    flex: 1,
    minWidth: 0,
  },
  columnTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 18,
    textTransform: 'uppercase',
  },
  columnTitlePhone: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 14,
  },
  linkItem: {
    paddingVertical: 6,
  },
  linkItemPhone: {
    paddingVertical: 4,
  },
  linkText: {
    color: '#6b7a8d',
    fontSize: 14,
    fontWeight: '500',
  },
  linkTextPhone: {
    fontSize: 12.5,
  },
  linkTextHover: {
    color: colors.blueDark,
  },
  divider: {
    height: 1,
    backgroundColor: '#e6eef4',
    marginTop: 32,
    marginBottom: 22,
  },
  dividerPhone: {
    marginTop: 32,
    marginBottom: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRowPhone: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyrightText: {
    color: '#7c8b9d',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  copyrightTextPhone: {
    fontSize: 12,
    textAlign: 'center',
  },
});
