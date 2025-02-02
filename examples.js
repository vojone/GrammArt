const CODE_EXAMPLES = [
`// Tree
global { 500 500 }

startshape S

// root position
rule S { a { x: 0 y: 25 } }

// branch continuation
rule a 0.7 { circle{} a { 0 -0.8 s: 0.98 } }
rule a 0.1 { circle{} a { 0 -0.8 r: 3 s: 0.98 } }
rule a 0.1 { circle{} a { 0 -0.8 r: -3 s: 0.98 } }

// branching
rule a 0.02 {
	circle{}
	a { 0 -0.8 r: -20 s: 0.98 }
	a { 0 -0.8 r: 20 s: 0.98 }
}
rule a 0.01 {
	circle{}
	a { 0 -0.8 r: -30 s: 0.97 }
	a { 0 -0.8 r: 5 s: 0.97 }
	a { 0 -0.8 r: 30 s: 0.97 }
}

// end of a branch
rule a 0.0008 {}

`,
`// Spiral
global { 500 500 rgb(255 50 50) }

startshape r

rule r { a { x: 5 y: -5 r: 10 } }
rule a { square { } a { 1 1 r: 10 s: 0.99 cc: rgb(5 5 5) } }

`,
`// Spiral cobweb
global { 500 500 }

startshape S

rule S { a { x: 5 y: -5 r: 10 } }
rule a 0.9 { square {} a { 1 1 r: 10 s: 0.98 } }

rule a 0.1 { square {} b { -1 -1 r: -10 s: 0.98 } a {} }
rule b { square {} b { -1 -1 r: 10 s: 0.97 } }

`,
];
