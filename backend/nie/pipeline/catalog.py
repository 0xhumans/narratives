"""Catalog of the 10 mega narratives and their sub-narratives."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SubNarrative:
    name: str
    slug: str


@dataclass(frozen=True)
class MegaNarrative:
    name: str
    slug: str
    sub_narratives: tuple[SubNarrative, ...]


MEGA_NARRATIVES: tuple[MegaNarrative, ...] = (
    MegaNarrative(
        name="Artificial Intelligence",
        slug="artificial-intelligence",
        sub_narratives=(
            SubNarrative("Agentic AI", "agentic-ai"),
            SubNarrative("Physical AI", "physical-ai"),
            SubNarrative("AI Infrastructure", "ai-infrastructure"),
            SubNarrative("AI Semiconductors", "ai-semiconductors"),
            SubNarrative("AI Memory (HBM & DRAM)", "ai-memory-hbm-dram"),
            SubNarrative("AI Networking", "ai-networking"),
            SubNarrative("AI Data Centers", "ai-data-centers"),
            SubNarrative("Synthetic Data", "synthetic-data"),
            SubNarrative("Edge AI", "edge-ai"),
            SubNarrative("Spiking Neural Networks", "spiking-neural-networks"),
        ),
    ),
    MegaNarrative(
        name="Robotics",
        slug="robotics",
        sub_narratives=(
            SubNarrative("Humanoid Robotics", "humanoid-robotics"),
            SubNarrative("Industrial Robotics", "industrial-robotics"),
            SubNarrative("Autonomous Mobile Robots", "autonomous-mobile-robots"),
            SubNarrative("Robotic Perception", "robotic-perception"),
            SubNarrative("Robotic Actuators", "robotic-actuators"),
        ),
    ),
    MegaNarrative(
        name="Nuclear Renaissance",
        slug="nuclear-renaissance",
        sub_narratives=(
            SubNarrative("Small Modular Reactors", "small-modular-reactors"),
            SubNarrative("Nuclear Fuel Cycle", "nuclear-fuel-cycle"),
            SubNarrative("Fusion Energy", "fusion-energy"),
            SubNarrative("Nuclear Licensing", "nuclear-licensing"),
        ),
    ),
    MegaNarrative(
        name="Defense Autonomy",
        slug="defense-autonomy",
        sub_narratives=(
            SubNarrative("Autonomous Weapons", "autonomous-weapons"),
            SubNarrative("Drone Swarms", "drone-swarms"),
            SubNarrative("Cyber Warfare", "cyber-warfare"),
            SubNarrative("Space Defense", "space-defense"),
            SubNarrative("Defense Electronics", "defense-electronics"),
        ),
    ),
    MegaNarrative(
        name="Aging Population",
        slug="aging-population",
        sub_narratives=(
            SubNarrative("Longevity Therapeutics", "longevity-therapeutics"),
            SubNarrative("Senior Care Robotics", "senior-care-robotics"),
            SubNarrative("Healthcare Automation", "healthcare-automation"),
            SubNarrative("Pension & Retirement", "pension-retirement"),
        ),
    ),
    MegaNarrative(
        name="Climate Adaptation",
        slug="climate-adaptation",
        sub_narratives=(
            SubNarrative("Water Infrastructure", "water-infrastructure"),
            SubNarrative("Resilient Agriculture", "resilient-agriculture"),
            SubNarrative("Flood & Heat Defense", "flood-heat-defense"),
            SubNarrative("Carbon Removal", "carbon-removal"),
            SubNarrative("Grid Hardening", "grid-hardening"),
        ),
    ),
    MegaNarrative(
        name="Reindustrialization",
        slug="reindustrialization",
        sub_narratives=(
            SubNarrative("Reshoring Manufacturing", "reshoring-manufacturing"),
            SubNarrative("Industrial Automation", "industrial-automation"),
            SubNarrative("Construction Technology", "construction-technology"),
            SubNarrative("Critical Minerals Processing", "critical-minerals-processing"),
        ),
    ),
    MegaNarrative(
        name="Space Economy",
        slug="space-economy",
        sub_narratives=(
            SubNarrative("Launch Services", "launch-services"),
            SubNarrative("Satellite Networks", "satellite-networks"),
            SubNarrative("Space Manufacturing", "space-manufacturing"),
            SubNarrative("Lunar & Asteroid Mining", "lunar-asteroid-mining"),
            SubNarrative("Space Domain Awareness", "space-domain-awareness"),
        ),
    ),
    MegaNarrative(
        name="Biotechnology Revolution",
        slug="biotechnology-revolution",
        sub_narratives=(
            SubNarrative("Gene Editing", "gene-editing"),
            SubNarrative("mRNA Therapeutics", "mrna-therapeutics"),
            SubNarrative("Synthetic Biology", "synthetic-biology"),
            SubNarrative("Biomanufacturing", "biomanufacturing"),
            SubNarrative("AI Drug Discovery", "ai-drug-discovery"),
        ),
    ),
    MegaNarrative(
        name="Resource Scarcity",
        slug="resource-scarcity",
        sub_narratives=(
            SubNarrative("Water Scarcity", "water-scarcity"),
            SubNarrative("Energy Minerals", "energy-minerals"),
            SubNarrative("Arable Land", "arable-land"),
            SubNarrative("Phosphorus & Fertilizer", "phosphorus-fertilizer"),
            SubNarrative("Rare Earth Elements", "rare-earth-elements"),
        ),
    ),
    MegaNarrative(
        name="Energy Transition & Storage",
        slug="energy-transition-storage",
        sub_narratives=(
            SubNarrative("Solar & Wind Scale-up", "solar-wind-scale-up"),
            SubNarrative("Battery Storage & Grid Flexibility", "battery-storage-grid-flexibility"),
            SubNarrative("Green Hydrogen", "green-hydrogen"),
            SubNarrative("Transmission & Interconnection", "transmission-interconnection"),
            SubNarrative("Carbon Markets & Offsets", "carbon-markets-offsets"),
        ),
    ),
    MegaNarrative(
        name="Electrification & Autonomous Mobility",
        slug="electrification-autonomous-mobility",
        sub_narratives=(
            SubNarrative("EV Adoption & Charging Infrastructure", "ev-adoption-charging"),
            SubNarrative("Battery Supply Chain", "battery-supply-chain"),
            SubNarrative("Autonomous Vehicles", "autonomous-vehicles"),
            SubNarrative("Smart Mobility & Fleet Electrification", "smart-mobility-fleet"),
            SubNarrative("Vehicle Software & ADAS", "vehicle-software-adas"),
        ),
    ),
    MegaNarrative(
        name="Cybersecurity & Digital Trust",
        slug="cybersecurity-digital-trust",
        sub_narratives=(
            SubNarrative("Enterprise Zero Trust", "enterprise-zero-trust"),
            SubNarrative("Identity & Access Management", "identity-access-management"),
            SubNarrative("Cloud Security", "cloud-security"),
            SubNarrative("OT & Critical Infrastructure Security", "ot-critical-infrastructure-security"),
            SubNarrative("AI-Enabled Threats & Defense", "ai-enabled-threats-defense"),
        ),
    ),
)


def all_mega_names() -> list[str]:
    return [m.name for m in MEGA_NARRATIVES]


def all_narrative_specs() -> list[tuple[str, str, str | None]]:
    """Return (name, slug, parent_slug_or_None) for every narrative to seed."""
    specs: list[tuple[str, str, str | None]] = []
    for mega in MEGA_NARRATIVES:
        specs.append((mega.name, mega.slug, None))
        for sub in mega.sub_narratives:
            specs.append((sub.name, sub.slug, mega.slug))
    return specs
