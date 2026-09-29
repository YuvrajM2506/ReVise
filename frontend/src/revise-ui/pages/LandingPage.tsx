import type { MouseEvent as ReactMouseEvent } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  Clock3,
  Code2,
  GitBranch,
  GitPullRequest,
  Layers3,
  LockKeyhole,
  MemoryStick,
  Radio,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow,
} from "lucide-react";
import { navigate } from "../components/Shell";
import styles from "./LandingPage.module.css";

function handleLandingNavigation(event: ReactMouseEvent<HTMLElement>) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = (event.target as HTMLElement).closest("a");
  if (!anchor || anchor.target && anchor.target !== "_self" || anchor.hasAttribute("download")) return;

  const destination = new URL(anchor.href, window.location.href);
  if (destination.origin !== window.location.origin || destination.hash || destination.pathname === "/github-backfill") return;

  event.preventDefault();
  navigate(`${destination.pathname}${destination.search}`);
}

const steps = [
  { number: "01", title: "Memory", detail: "Past PRs, incidents and decisions become durable engineering context.", icon: BrainCircuit, href: "/memory" },
  { number: "02", title: "Reasoning", detail: "Hindsight retrieves the evidence that actually matters to this change.", icon: Sparkles, href: "/analyze" },
  { number: "03", title: "Review", detail: "Findings arrive with history, impact and a safer path forward.", icon: GitPullRequest, href: "/github-review" },
  { number: "04", title: "Learning", detail: "Review outcomes feed the next, more informed code review.", icon: Radio, href: "/teach" },
];

const features = [
  { icon: MemoryStick, title: "Context that compounds", text: "Bring the team's decisions, conventions and hard-won lessons into every review.", href: "/memory" },
  { icon: ShieldCheck, title: "Evidence, not guesswork", text: "Trace findings back to the PR, incident or standard that makes them relevant.", href: "/dashboard" },
  { icon: GitBranch, title: "Reviews in your workflow", text: "Connect repository changes with practical risk signals and rollout guidance.", href: "/github-review" },
  { icon: LockKeyhole, title: "Your team's knowledge", text: "Keep engineering context close to your repositories and review process.", href: "/standards" },
];

function ReviewPreview() {
  return (
    <div className={styles.preview} aria-label="Example memory-informed code review">
      <div className={styles.previewTopbar}>
        <div className={styles.windowDots}><i/><i/><i/></div>
        <div className={styles.repoPath}><span>acme / platform</span><ChevronRight size={13}/><span>pull / 1842</span></div>
        <span className={styles.openState}><span/> Review complete</span>
      </div>
      <div className={styles.reviewTitle}>
        <div><div className={styles.reviewEyebrow}><GitPullRequest size={14}/> PULL REQUEST <span>#1842</span></div><h2>Move session validation into middleware</h2><p>Alex Morgan opened 18 minutes ago · 6 files changed</p></div>
        <a className={styles.reviewBadge} href="/dashboard" aria-label="Open example review report"><Check size={13}/> 3 findings <ArrowUpRight size={12}/></a>
      </div>
      <div className={styles.previewGrid}>
        <div className={styles.reviewMain}>
          <div className={styles.riskCard}>
            <div className={styles.riskDial}><strong>24</strong><span>/100</span></div>
            <div className={styles.riskCopy}><span>CHANGE RISK</span><strong>Low, with one thing to resolve</strong><p>Grounded in 4 relevant memories from your team.</p></div>
            <span className={styles.riskTrend}><ArrowDown size={13}/> 12% lower</span>
          </div>
          <div className={styles.finding}>
            <div className={styles.findingTop}><span className={styles.severity}><i/> HIGH · SECURITY</span><span className={styles.fileName}>src/auth/session.ts <span>:48</span></span></div>
            <h3>Session is mutated before validation</h3>
            <p>A failed validation leaves the session partially updated. Validate the current session before applying changes.</p>
            <div className={styles.codeDiff}><span>46</span> const session = await getSession(id)<br/><span>47</span> <b className={styles.remove}>- await updateSession(session, input)</b><br/><span>48</span> <b className={styles.add}>+ assertValid(session)</b><br/><span>49</span> <b className={styles.add}>+ await updateSession(session, input)</b></div>
            <div className={styles.findingFooter}><BrainCircuit size={13}/><span>Matches an authentication incident from March</span><ArrowUpRight size={13}/></div>
          </div>
        </div>
        <aside className={styles.memoryPanel}>
          <div className={styles.memoryHeading}><span><BrainCircuit size={14}/> HINDSIGHT MEMORY</span><span className={styles.liveIndicator}>LIVE</span></div>
          <div className={styles.memoryMatch}><div className={styles.matchScore}>94% match <span>· incident</span></div><blockquote>“Validate before writing session state. A partial mutation caused a privilege escalation.”</blockquote><a className={styles.memorySource} href="/timeline"><span>INC-208</span> Authentication regression <ArrowUpRight size={11}/></a></div>
          <div className={styles.memoryMatch}><div className={styles.matchScore}>88% match <span>· pull request</span></div><blockquote>“Keep auth changes fail-closed. We rolled this back after a session bypass.”</blockquote><a className={styles.memorySource} href="/dashboard"><span>PR #1604</span> Add session rotation <ArrowUpRight size={11}/></a></div>
          <div className={styles.rollout}><div><span className={styles.rolloutIcon}><Radio size={13}/></span><span>SAFER ROLLOUT</span></div><p>Ship behind <code>session-v2</code>; monitor auth failures for 24h.</p></div>
        </aside>
      </div>
      <div className={styles.previewFooter}><span><span className={styles.footerPulse}/> ReVise review agent</span><span>Context retrieved in 182ms</span><span>Powered by Hindsight</span></div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.landing} onClick={handleLandingNavigation}>
      <div className={styles.ambient} aria-hidden="true"/>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="ReVise home"><span className={styles.brandMark}><span/></span><span>ReVise</span></a>
        <nav className={styles.nav} aria-label="Main navigation"><a href="/analyze">Analyze</a><a href="/github-review">PR Review</a><a href="/memory">Memory</a><a href="/pair-programmer">Pair Programmer</a><a href="/cli-docs">CLI Docs</a></nav>
        <a className={styles.navCta} href="/dashboard">Open Dashboard <ArrowUpRight size={14}/></a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span className={styles.eyebrowPulse}/> MEMORY-AWARE CODE REVIEW <span className={styles.eyebrowLine}/></div>
          <h1>AI code review<br/>that <span>remembers.</span></h1>
          <p className={styles.heroLead}>ReVise learns from your team&apos;s PRs, incidents, rollbacks and post-mortems to make every code review more contextual and actionable.</p>
          <div className={styles.heroActions}><a className={styles.primaryButton} href="/analyze">Analyze Code <ArrowRight size={16}/></a><a className={styles.secondaryButton} href="#how-it-works">See How It Works <ArrowDown size={14}/></a></div>
          <div className={styles.heroProof}><span><Check size={13}/> Your team's history, in context</span><i/><span>Built for real engineering workflows</span></div>
        </div>
        <div className={styles.heroVisual}><div className={styles.visualGlow}/><ReviewPreview/><div className={styles.visualCaption}><span>REVIEW / 1842</span><span>History changes the answer.</span></div></div>
      </section>

      <div className={styles.trustLine}><span>ONE REVIEW, INFORMED BY</span><div><a href="/github-review"><GitPullRequest size={14}/> Pull requests</a><a href="/timeline"><Radio size={14}/> Incidents</a><a href="/timeline"><Workflow size={14}/> Rollbacks</a><a href="/teach"><Layers3 size={14}/> Post-mortems</a></div></div>

      <section className={styles.forgetSection}>
        <div className={styles.sectionIntro}><span className={styles.sectionKicker}>THE CONTEXT GAP</span><h2>Every review starts<br/>from scratch.</h2><p>Most AI reviewers see a diff. They don&apos;t see the outage last quarter, the rollback on Friday, or the reason your team chose this pattern.</p></div>
        <div className={styles.forgetContent}><div className={styles.forgetTop}><span><CircleDot size={14}/> A familiar failure mode</span><span>WITHOUT MEMORY</span></div><div className={styles.forgetQuote}><span className={styles.quoteMark}>“</span><p>Looks good to me. Consider adding validation before saving.</p><span className={styles.genericTag}>No history. No evidence. No why.</span></div><div className={styles.forgetBottom}><span><Clock3 size={14}/> Same lesson, learned again.</span><a className={styles.forgetCount} href="/timeline">PR #1842 <ArrowRight size={13}/> PR #1604 <ArrowRight size={13}/> INC-208 <ArrowUpRight size={12}/></a></div></div>
      </section>

      <section className={styles.hindsightSection} id="how-it-works">
        <div className={styles.hindsightHeader}><div><span className={styles.sectionKicker}>THE HINDSIGHT ADVANTAGE</span><h2>Memory makes the<br/><span>difference.</span></h2></div><p>ReVise doesn&apos;t just scan code. It retrieves the most relevant engineering history, reasons over the evidence, and brings the lesson forward.</p></div>
        <div className={styles.memoryFlow}><div className={styles.flowLine}/>{steps.map(({ number, title, detail, icon: Icon, href }) => <a className={styles.flowStep} href={href} key={number}><div className={styles.flowMeta}><span>{number}</span><span className={styles.flowIcon}><Icon size={17}/></span></div><h3>{title}</h3><p>{detail}</p><span className={styles.flowAction}>Open {title} <ArrowRight size={12}/></span></a>)}</div>
        <div className={styles.memoryQuote}><span className={styles.quoteIcon}><BrainCircuit size={16}/></span><p><strong>“We saw this before.”</strong> A useful review starts with what your team already knows.</p><a className={styles.memoryQuoteAction} href="/memory">Explore Memory <ArrowUpRight size={12}/></a></div>
        <div className={styles.moduleLinks}><a href="/timeline">Explore team history <ArrowRight size={13}/></a><a href="/github-backfill">Seed memory from GitHub <ArrowRight size={13}/></a><a href="/standards">Browse engineering standards <ArrowRight size={13}/></a></div>
      </section>

      <section className={styles.pairSection}>
        <div className={styles.pairCopy}><span className={styles.sectionKicker}>FROM REVIEW TO BUILD</span><h2>Your pair programmer<br/>knows the backstory.</h2><p>Move from finding to fix without losing context. ReVise brings the same team memory into an Aider-powered coding session, so suggestions fit how your codebase actually works.</p><a className={styles.textLink} href="/pair-programmer">Explore AI Pair Programmer <ArrowRight size={15}/></a><div className={styles.pairNote}><span><Bot size={15}/></span><span><strong>Powered by Aider</strong><br/>Open-source, repo-aware coding</span></div></div>
        <div className={styles.terminal}>
          <div className={styles.terminalBar}><div className={styles.windowDots}><i/><i/><i/></div><span><TerminalSquare size={13}/> aider · session.ts</span><span className={styles.terminalContext}><BrainCircuit size={12}/> 3 memories in context</span></div>
          <div className={styles.terminalBody}><div className={styles.terminalPrompt}><span>YOU</span><p>Why do we validate before session writes?</p></div><div className={styles.terminalReply}><span><Sparkles size={13}/> AIDER + REVISE MEMORY</span><p>In <a>INC-208</a>, a partial session mutation allowed a privilege escalation. The team&apos;s standard is to validate first, then write.</p><div className={styles.terminalCode}><span>if (!validateSession(current)) &#123;</span><br/><b>  throw new AuthenticationError()</b><br/><span>&#125;</span><br/><span>await applySessionMutation(current, input)</span></div><div className={styles.terminalRef}><GitPullRequest size={12}/> Team decision · PR #1604 <span>94% relevance</span></div></div></div>
          <a className={styles.terminalInput} href="/pair-programmer" aria-label="Open AI Pair Programmer"><span>Open AI Pair Programmer</span><span><ArrowUpRight size={14}/></span></a>
        </div>
      </section>

      <section className={styles.cliSection} id="cli">
        <div className={styles.cliCopy}>
          <span className={styles.sectionKicker}>DEVELOPER-FIRST TERMINAL & CI/CD</span>
          <h2>Memory-aware review<br/>in your <span>terminal.</span></h2>
          <p>
            Run reviews on local branches, staged diffs, or gate CI/CD pull requests with risk thresholds — all powered by the same Hindsight memory bank.
          </p>
          <div className={styles.cliActionRow}>
            <a className={styles.primaryButton} href="/cli-docs">
              Explore CLI Docs <ArrowRight size={16}/>
            </a>
            <div className={styles.cliSnippet}>
              <span>$</span>
              <code>npm run revise -- review</code>
            </div>
          </div>
          <div className={styles.cliHighlights}>
            <div><span className={styles.cliDot}/><span><strong>CI/CD Gate:</strong> Block high-risk PRs with <code>--fail-on HIGH</code></span></div>
            <div><span className={styles.cliDot}/><span><strong>Zero Setup:</strong> Resilient offline simulator when keys are omitted</span></div>
            <div><span className={styles.cliDot}/><span><strong>Causal Attribution:</strong> Real historical incident citations</span></div>
          </div>
        </div>
        <div className={styles.cliTerminalCard}>
          <div className={styles.terminalBar}>
            <div className={styles.windowDots}><i/><i/><i/></div>
            <span><TerminalSquare size={13}/> revise · review</span>
            <span className={styles.openState}><span/> HINDSIGHT LIVE</span>
          </div>
          <div className={styles.cliTerminalBody}>
            <div className={styles.cliCommandRow}>
              <span className={styles.cliPrompt}>$</span>
              <span className={styles.cliCommand}>git diff | revise review - --fail-on HIGH</span>
            </div>
            <div className={styles.cliOutput}>
              <div className={styles.cliEvalHeader}>
                <span className={styles.cliRiskBadge}>RISK 78 / 100 · HIGH</span>
                <span className={styles.cliMemCitation}><BrainCircuit size={12}/> Grounded in 4 memories</span>
              </div>
              <div className={styles.cliFinding}>
                <div className={styles.cliFindingTitle}>
                  <span className={styles.cliSeverityHigh}>● HIGH</span>
                  <span>Session mutated prior to validation assert</span>
                </div>
                <div className={styles.cliFindingFile}>src/auth/session.ts:48</div>
                <div className={styles.cliCitationBox}>
                  <strong>Cites INC-208</strong> · Authentication regression (orders-service)<br/>
                  <em>“Validate before writing session state to prevent privilege escalation.”</em>
                </div>
              </div>
              <div className={styles.cliGateResult}>
                <span>✕ CI GATE FAILED:</span> Risk score 78 exceeds threshold HIGH (Exit code: 1)
              </div>
            </div>
          </div>
          <a className={styles.terminalInput} href="/cli-docs" aria-label="Explore CLI Documentation">
            <span>View all 11 CLI commands & examples</span>
            <span><ArrowUpRight size={14}/></span>
          </a>
        </div>
      </section>

      <section className={styles.featuresSection} id="features"><div className={styles.featuresHeader}><div><span className={styles.sectionKicker}>BUILT FOR THE WAY TEAMS SHIP</span><h2>More signal in every review.</h2></div><p>Institutional knowledge, available exactly when a change needs it.</p></div><div className={styles.featuresGrid}>{features.map(({ icon: Icon, title, text, href }, index) => <a className={styles.feature} href={href} key={title}><span className={styles.featureIndex}>0{index + 1}</span><span className={styles.featureIcon}><Icon size={18}/></span><h3>{title}</h3><p>{text}</p><span className={styles.featureAction}>Explore <ArrowRight size={12}/></span><ArrowUpRight className={styles.featureArrow} size={15}/></a>)}</div></section>

      <section className={styles.archSection} id="architecture"><div className={styles.archHeader}><div><span className={styles.sectionKicker}>A SYSTEM THAT GETS WISER</span><h2>Built around memory.<br/>Designed for your stack.</h2></div><p>Purpose-built components connect review workflows to a durable, searchable history of engineering decisions.</p></div><div className={styles.archDiagram}><a className={styles.archNode} href="/github-review"><span><GitPullRequest size={18}/></span><strong>Code changes</strong><small>GitHub · local diff</small></a><div className={styles.archConnector}><i/><span>ingest</span><i/></div><a className={`${styles.archNode} ${styles.archNodeAccent}`} href="/analyze"><span><BrainCircuit size={18}/></span><strong>ReVise agent</strong><small>Review · reason · learn</small></a><div className={styles.archConnector}><i/><span>retrieve</span><i/></div><a className={styles.archNode} href="/memory"><span><MemoryStick size={18}/></span><strong>Hindsight memory</strong><small>Episodes · facts · links</small></a><div className={styles.archConnector}><i/><span>evidence</span><i/></div><a className={styles.archNode} href="/dashboard"><span><Code2 size={18}/></span><strong>Actionable review</strong><small>Findings · rollout · learn</small></a></div><div className={styles.archFoot}><span><LockKeyhole size={13}/> Your engineering context stays yours</span><span><a href="/settings">Configure workspace <ArrowUpRight size={11}/></a> <i/> <a href="/github-backfill">Import GitHub history <ArrowUpRight size={11}/></a></span></div></section>

      <section className={styles.finalCta}><div className={styles.ctaGlow}/><div className={styles.ctaMark}><span/></div><span className={styles.sectionKicker}>THE NEXT REVIEW CAN KNOW MORE</span><h2>Give your code review<br/>a memory.</h2><p>Make every past lesson useful for the next change.</p><div className={styles.ctaActions}><a className={styles.primaryButton} href="/analyze">Analyze Code <ArrowRight size={16}/></a><a className={styles.secondaryButton} href="/teach">Teach ReVise <ArrowUpRight size={14}/></a></div><span className={styles.ctaFine}>Start with a diff. Bring your team's history.</span></section>

      <footer className={styles.footer}><a className={styles.brand} href="/" aria-label="ReVise home"><span className={styles.brandMark}><span/></span><span>ReVise</span></a><span>AI code review that remembers.</span><div><a href="/dashboard">Dashboard</a><a href="/analyze">Analyze</a><a href="/github-review">PR Review</a><a href="/memory">Memory</a><a href="/timeline">Timeline</a><a href="/cli-docs">CLI Docs</a><a href="/teach">Teach ReVise</a><a href="/pair-programmer">Pair Programmer</a><a href="/github-backfill">Import history</a><a href="/standards">Standards</a><a href="/settings">Settings</a><a href="/dashboard">Reports</a><a href="#how-it-works">How it works</a><a href="#architecture">Architecture</a></div><span className={styles.footerVersion}>HINDSIGHT MEMORY · AIDER-POWERED</span></footer>
    </main>
  );
}