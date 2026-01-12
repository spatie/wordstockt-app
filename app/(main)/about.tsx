import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Image,
  Pressable,
  Linking,
} from 'react-native';
import { colors } from '../../src/config/theme';

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LinkButton({
  url,
  label,
  icon,
}: {
  url: string;
  label: string;
  icon: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.linkButton,
        pressed && styles.linkButtonPressed,
      ]}
      onPress={() => Linking.openURL(url)}
    >
      <Text style={styles.linkIcon}>{icon}</Text>
      <Text style={styles.linkText}>{label}</Text>
      <Text style={styles.linkArrow}>→</Text>
    </Pressable>
  );
}

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.pageTitle}>About</Text>
        <Text style={styles.pageSubtitle}>
          WordStockt is brought to you by Spatie, a web development agency from
          Antwerp, Belgium.
        </Text>

        {/* Spatie Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/spatie-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* About Spatie */}
        <InfoCard title="About Spatie">
          <Text style={styles.cardText}>
            Spatie is a digital agency specializing in crafting web applications
            within the Laravel ecosystem. Based in Antwerp, Belgium, we develop
            custom solutions, create open-source packages, and produce
            educational courses.
          </Text>
          <Text style={[styles.cardText, styles.cardTextMargin]}>
            Our open-source packages have been downloaded over{' '}
            <Text style={styles.highlight}>2 billion times</Text> globally,
            making us one of the top-ranking PHP developers on GitHub.
          </Text>
        </InfoCard>

        {/* Open Source */}
        <InfoCard title="Open Source">
          <Text style={styles.cardText}>
            WordStockt is open source! We believe in sharing knowledge and
            contributing to the developer community. Feel free to explore the
            code, learn from it, or contribute improvements.
          </Text>
          <View style={styles.linksContainer}>
            <LinkButton
              url="https://github.com/spatie/wordstockt.com"
              label="Backend Repository"
              icon="⚙️"
            />
            <LinkButton
              url="https://github.com/spatie/wordstockt-app"
              label="Mobile App Repository"
              icon="📱"
            />
          </View>
        </InfoCard>

        {/* Visit Spatie */}
        <InfoCard title="Learn More">
          <Text style={styles.cardText}>
            Visit our website to learn more about our work, explore our
            open-source packages, or get in touch with our team.
          </Text>
          <View style={styles.linksContainer}>
            <LinkButton url="https://spatie.be" label="spatie.be" icon="🌐" />
          </View>
        </InfoCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ in Antwerp</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  cardTextMargin: {
    marginTop: 12,
  },
  highlight: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  linksContainer: {
    marginTop: 16,
    gap: 10,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  linkArrow: {
    fontSize: 16,
    color: colors.textMuted,
  },
  footer: {
    marginTop: 8,
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
