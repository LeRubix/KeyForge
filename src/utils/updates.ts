export interface UpdateInfo {
  version: string;
  url: string;
  releaseNotes?: string;
  publishedAt: string;
}

export interface GitHubRelease {
  tag_name: string;
  html_url: string;
  body: string;
  published_at: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

const GITHUB_API_BASE = 'https://api.github.com';

function getRepoOwner(): string {
  if (typeof window !== 'undefined' && (window as any).__KEYFORGE_REPO_OWNER__) {
    return (window as any).__KEYFORGE_REPO_OWNER__;
  }
  const envOwner = import.meta.env.VITE_GITHUB_REPO_OWNER;
  if (envOwner) return envOwner;
  
  const packageJson = (window as any).__PACKAGE_JSON__;
  if (packageJson?.repository?.url) {
    const match = packageJson.repository.url.match(/github\.com[/:]([^/]+)\/([^/]+)/);
    if (match) return match[1];
  }
  
  return 'LeRubix';
}

function getRepoName(): string {
  if (typeof window !== 'undefined' && (window as any).__KEYFORGE_REPO_NAME__) {
    return (window as any).__KEYFORGE_REPO_NAME__;
  }
  const envName = import.meta.env.VITE_GITHUB_REPO_NAME;
  if (envName) return envName;
  
  const packageJson = (window as any).__PACKAGE_JSON__;
  if (packageJson?.repository?.url) {
    const match = packageJson.repository.url.match(/github\.com[/:]([^/]+)\/([^/]+)/);
    if (match) {
      const repoName = match[2].replace(/\.git$/, '');
      return repoName;
    }
  }
  
  return 'KeyForge';
}

function parseVersion(versionString: string): number[] {
  const cleaned = versionString.replace(/^v/, '').trim();
  const parts = cleaned.split('.').map(Number);
  while (parts.length < 3) {
    parts.push(0);
  }
  return parts.slice(0, 3);
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);
  
  for (let i = 0; i < 3; i++) {
    if (parts1[i] > parts2[i]) return 1;
    if (parts1[i] < parts2[i]) return -1;
  }
  return 0;
}

export function isNewerVersion(latest: string, current: string): boolean {
  return compareVersions(latest, current) > 0;
}

export async function checkForUpdates(currentVersion: string): Promise<UpdateInfo | null> {
  try {
    const owner = getRepoOwner();
    const name = getRepoName();
    const apiUrl = `${GITHUB_API_BASE}/repos/${owner}/${name}/releases/latest`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const release: GitHubRelease = await response.json();
    const latestVersion = release.tag_name;

    if (!isNewerVersion(latestVersion, currentVersion)) {
      return null;
    }

    const platform = getPlatform();
    const asset = release.assets.find(a => matchesPlatform(a.name, platform));

    return {
      version: latestVersion,
      url: asset ? asset.browser_download_url : release.html_url,
      releaseNotes: release.body || '',
      publishedAt: release.published_at,
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return null;
  }
}

function getPlatform(): string {
  if (typeof window === 'undefined') {
    return 'unknown';
  }
  
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  if (platform.includes('win') || userAgent.includes('win')) {
    return 'windows';
  }
  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'mac';
  }
  if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }
  return 'unknown';
}

function matchesPlatform(filename: string, platform: string): boolean {
  const lower = filename.toLowerCase();
  
  if (platform === 'windows') {
    return lower.endsWith('.exe') || lower.includes('win') || lower.includes('windows');
  }
  if (platform === 'mac') {
    return lower.endsWith('.dmg') || lower.endsWith('.pkg') || lower.includes('mac') || lower.includes('darwin');
  }
  if (platform === 'linux') {
    return lower.endsWith('.deb') || lower.endsWith('.appimage') || lower.includes('linux');
  }
  
  return false;
}

declare const __KEYFORGE_VERSION__: string;

export function getCurrentVersion(): string {
  try {
    if (typeof __KEYFORGE_VERSION__ !== 'undefined') {
      return 'v' + __KEYFORGE_VERSION__;
    }
  } catch (e) {
  }
  
  if (typeof window !== 'undefined' && (window as any).__KEYFORGE_VERSION__) {
    return (window as any).__KEYFORGE_VERSION__;
  }
  return 'v2.0.0';
}
