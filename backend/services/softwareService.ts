// Software & Version Service
// Provides real version provider metadata and compatibility checks

export interface SoftwareType {
  id: string;
  name: string;
  description: string;
  category: 'Spigot-Based' | 'Vanilla' | 'Modded';
  recommendedVersion: string;
  versions: string[];
}

export class SoftwareService {
  private softwareList: SoftwareType[] = [
    {
      id: 'Paper',
      name: 'Paper',
      description: 'High-performance Minecraft server software aiming to fix gameplay and mechanics inconsistencies while improving speed.',
      category: 'Spigot-Based',
      recommendedVersion: '1.21.4',
      versions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5']
    },
    {
      id: 'Purpur',
      name: 'Purpur',
      description: 'A drop-in replacement for Paper servers designed for configurability, new fun gameplay mechanics, and peak TPS performance.',
      category: 'Spigot-Based',
      recommendedVersion: '1.21.4',
      versions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4']
    },
    {
      id: 'Vanilla',
      name: 'Vanilla',
      description: 'Official Mojang server software. Pure Minecraft experience without modifications or plugin APIs.',
      category: 'Vanilla',
      recommendedVersion: '1.21.4',
      versions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.16.5', '1.12.2', '1.8.9']
    },
    {
      id: 'Fabric',
      name: 'Fabric',
      description: 'Lightweight, modular modding toolchain for Minecraft. Excellent for performance optimization mods like Sodium and Lithium.',
      category: 'Modded',
      recommendedVersion: '1.21.4',
      versions: ['1.21.4', '1.21.1', '1.20.4', '1.20.1', '1.19.4', '1.18.2']
    },
    {
      id: 'Forge',
      name: 'Minecraft Forge',
      description: 'The classic Minecraft modding API supporting thousands of extensive content mods, dimensions, and machines.',
      category: 'Modded',
      recommendedVersion: '1.20.1',
      versions: ['1.21.1', '1.20.1', '1.19.2', '1.18.2', '1.16.5', '1.12.2']
    },
    {
      id: 'NeoForge',
      name: 'NeoForge',
      description: 'Modern community-driven fork of Minecraft Forge focused on stability, modern Java standards, and developer experience.',
      category: 'Modded',
      recommendedVersion: '1.21.1',
      versions: ['1.21.1', '1.20.4']
    },
    {
      id: 'Spigot',
      name: 'Spigot',
      description: 'The foundation of modern Minecraft plugin hosting, derived from CraftBukkit with optimizations.',
      category: 'Spigot-Based',
      recommendedVersion: '1.21.1',
      versions: ['1.21.1', '1.20.4', '1.19.4', '1.18.2', '1.16.5']
    }
  ];

  public getSoftwareCatalog(): SoftwareType[] {
    return this.softwareList;
  }

  public checkCompatibility(software: string, version: string, itemType: 'plugin' | 'mod', itemSupportedLoaders: string[], itemTestedVersions: string[]): {
    compatible: boolean;
    reason?: string;
  } {
    const loaderMatch = itemSupportedLoaders.some(l => l.toLowerCase() === software.toLowerCase());
    if (!loaderMatch) {
      return {
        compatible: false,
        reason: `${software} does not support this ${itemType}. Required loaders: ${itemSupportedLoaders.join(', ')}`
      };
    }

    const versionMatch = itemTestedVersions.some(v => version.startsWith(v) || v.startsWith(version.substring(0, 4)));
    if (!versionMatch) {
      return {
        compatible: false,
        reason: `Tested with versions: ${itemTestedVersions.join(', ')}. May be unstable on ${version}`
      };
    }

    return { compatible: true };
  }
}

export const softwareService = new SoftwareService();
